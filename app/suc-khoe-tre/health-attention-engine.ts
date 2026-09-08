import type { HealthLocalState, Reminder } from "./health-local-store";
import { nextReminderOccurrence } from "./health-reminders";
import type { HealthAttentionItem, HealthAttentionSnapshot, HealthDataGap, HealthDueItem } from "./health-attention-contracts";

const MAX_PRIMARY_ITEMS = 5;
const DUE_WINDOW_MS = 24 * 60 * 60 * 1000;

const reminderDomain: Record<Reminder["category"], string> = {
  nutrition: "nutrition-hydration",
  water: "nutrition-hydration",
  activity: "physical-activity",
  care: "oral-skin-hygiene",
  growth: "growth-development",
  appointment: "records-appointments-documents",
  other: "records-appointments-documents",
};

function formatDue(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function reminderDueItems(state: HealthLocalState, profileId: string, now: Date): HealthDueItem[] {
  const deadline = now.getTime() + DUE_WINDOW_MS;
  return state.reminders.flatMap((reminder) => {
    const next = nextReminderOccurrence(reminder, now);
    if (!next || next.getTime() > deadline) return [];
    return [{
      id: `due-${profileId}-${reminder.id}-${next.toISOString()}`,
      profileId,
      domainId: reminderDomain[reminder.category],
      title: reminder.title,
      dueDate: next.toISOString(),
      source: "user-plan" as const,
      relatedRecordId: reminder.id,
      privacy: "standard" as const,
    }];
  }).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
}

function completenessGaps(state: HealthLocalState, profileId: string): HealthDataGap[] {
  const gaps: HealthDataGap[] = [];
  if (!state.profile.name.trim()) gaps.push({
    id: `gap-${profileId}-profile-name`,
    profileId,
    domainId: "records-appointments-documents",
    title: "Chưa đặt tên cho hồ sơ",
    reason: "missing-core-profile",
    blocksClinicalRule: false,
    privacy: "standard",
  });
  if (!state.profile.birthDate) gaps.push({
    id: `gap-${profileId}-profile-birth-date`,
    profileId,
    domainId: "growth-development",
    title: "Thiếu ngày sinh để tính đúng tuổi theo tháng",
    reason: "missing-core-profile",
    blocksClinicalRule: true,
    privacy: "sensitive",
  });
  if (!state.profile.sex) gaps.push({
    id: `gap-${profileId}-profile-growth-sex`,
    profileId,
    domainId: "growth-development",
    title: "Chưa chọn giới tính dùng cho tham chiếu tăng trưởng WHO",
    reason: "missing-core-profile",
    blocksClinicalRule: true,
    privacy: "sensitive",
  });
  if (!state.growth.length) gaps.push({
    id: `gap-${profileId}-growth-baseline`,
    profileId,
    domainId: "growth-development",
    title: "Chưa có mốc chiều cao/cân nặng ban đầu",
    reason: "other",
    blocksClinicalRule: true,
    privacy: "sensitive",
  });
  return gaps;
}

function dueToAttention(item: HealthDueItem): HealthAttentionItem {
  const due = item.dueDate ? new Date(item.dueDate) : null;
  return {
    id: `attention-${item.id}`,
    profileId: item.profileId,
    title: item.title,
    summary: due && Number.isFinite(due.getTime()) ? `Lịch người dùng đặt · ${formatDue(due)}` : "Lịch người dùng đặt",
    domainId: item.domainId,
    priority: "due",
    source: "user-reminder",
    dueAt: item.dueDate,
    privacy: item.privacy,
    action: "open-due-item",
  };
}

function gapToAttention(item: HealthDataGap): HealthAttentionItem {
  return {
    id: `attention-${item.id}`,
    profileId: item.profileId,
    title: item.title,
    summary: item.blocksClinicalRule ? "Thiếu dữ liệu cần thiết cho một số tính năng tham chiếu." : "Dữ liệu nền chưa hoàn chỉnh.",
    domainId: item.domainId,
    priority: "info",
    source: "data-quality",
    privacy: item.privacy,
    action: "complete-data",
  };
}

export function buildOperationalAttentionSnapshot(state: HealthLocalState, profileId: string, now = new Date()): HealthAttentionSnapshot {
  const due = reminderDueItems(state, profileId, now);
  const dataGaps = completenessGaps(state, profileId);
  const attention = [...due.map(dueToAttention), ...dataGaps.map(gapToAttention)].slice(0, MAX_PRIMARY_ITEMS);
  return {
    generatedAt: now.toISOString(),
    due,
    dataGaps,
    trends: [],
    openEpisodes: [],
    attention,
  };
}

export function operationalCompleteness(state: HealthLocalState) {
  const checks = [
    { id: "name", label: "Tên hồ sơ", complete: Boolean(state.profile.name.trim()), target: "profile" as const },
    { id: "birthDate", label: "Ngày sinh", complete: Boolean(state.profile.birthDate), target: "profile" as const },
    { id: "sex", label: "Thông tin cho biểu đồ WHO", complete: Boolean(state.profile.sex), target: "profile" as const },
    { id: "growth", label: "Mốc tăng trưởng ban đầu", complete: state.growth.length > 0, target: "growth" as const },
  ];
  return { checks, completed: checks.filter((item) => item.complete).length, total: checks.length };
}
