"use client";

import { useEffect, useState } from "react";
import HealthClient from "../health-client";
import { createDailyRecord, createInitialHealthState, shiftDateKey, todayKey, type HealthLocalState } from "../health-local-store";
import { saveHealthProfileRegistry, saveHealthProfileState } from "../health-profile-registry";
import type { HealthProfileRegistry } from "../health-profile-contracts";

function seededTeenState(): HealthLocalState {
  const today = todayKey();
  const state = createInitialHealthState();
  state.profile = { name: "Bảo Anh", birthDate: "2013-07-25", sex: "female", note: "Preview UI" };
  state.growth = [
    { id: "g-1", date: shiftDateKey(today, -150), heightCm: 156.1, weightKg: 47.7 },
    { id: "g-2", date: shiftDateKey(today, -120), heightCm: 156.6, weightKg: 48.1 },
    { id: "g-3", date: shiftDateKey(today, -90), heightCm: 157.1, weightKg: 48.4 },
    { id: "g-4", date: shiftDateKey(today, -60), heightCm: 157.6, weightKg: 48.7 },
    { id: "g-5", date: shiftDateKey(today, -30), heightCm: 158.0, weightKg: 49.0 },
    { id: "g-6", date: today, heightCm: 158.2, weightKg: 49.1 },
  ];
  return state;
}

function seededInfantState(): HealthLocalState {
  const today = todayKey();
  const state = createInitialHealthState();
  state.profile = { name: "Bé 9 tháng", birthDate: "2025-12-09", sex: "male", note: "Preview infant runtime" };
  state.growth = [
    { id: "ig-1", date: shiftDateKey(today, -90), heightCm: 66.2, weightKg: 7.4 },
    { id: "ig-2", date: shiftDateKey(today, -60), heightCm: 67.8, weightKg: 7.8 },
    { id: "ig-3", date: shiftDateKey(today, -30), heightCm: 69.1, weightKg: 8.1 },
    { id: "ig-4", date: today, heightCm: 70.2, weightKg: 8.4 },
  ];
  state.reminders = [
    { id: "ir-meal", title: "Bữa ăn bổ sung", category: "nutrition", date: today, time: "10:00", repeat: "daily", enabled: true },
    { id: "ir-sleep", title: "Theo dõi giấc ngủ", category: "care", date: today, time: "20:00", repeat: "daily", enabled: true },
  ];
  for (let offset = -3; offset <= 0; offset += 1) {
    const key = shiftDateKey(today, offset);
    const day = createDailyRecord();
    day.foodGroups = ["Đạm", "Rau", "Trái cây", "Ngũ cốc / tinh bột", "Nước"];
    day.waterCups = 2;
    day.meals = [{ id: `infant-meal-${offset}`, meal: "lunch", text: "Cháo thịt rau mềm · sữa mẹ/sữa phù hợp", createdAt: new Date().toISOString() }];
    day.sleepStart = "20:30";
    day.sleepEnd = "06:30";
    day.feeling = "good";
    state.days[key] = day;
  }
  return state;
}

export default function VisualPreviewClient() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const now = new Date().toISOString();
    const teenId = "preview-bao-anh";
    const infantId = "preview-be-9-thang";
    const registry: HealthProfileRegistry = {
      schemaVersion: 1,
      activeProfileId: infantId,
      updatedAt: now,
      profiles: [
        { id: teenId, displayName: "Bảo Anh", birthDate: "2013-07-25", sexForGrowthReference: "female", createdAt: now, updatedAt: now },
        { id: infantId, displayName: "Bé 9 tháng", birthDate: "2025-12-09", sexForGrowthReference: "male", createdAt: now, updatedAt: now },
      ],
    };
    saveHealthProfileRegistry(registry);
    saveHealthProfileState(teenId, seededTeenState());
    saveHealthProfileState(infantId, seededInfantState());
    setReady(true);
  }, []);

  if (!ready) return <div style={{ padding: 40 }}>Đang dựng preview…</div>;
  return <HealthClient initialCourse={{ preview: true }} device={{ deviceCode: "SK-PREVIEW", deviceType: "desktop", editEnabled: true, calendarEnabled: true }} />;
}
