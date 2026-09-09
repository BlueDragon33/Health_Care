"use client";

import { useEffect, useState } from "react";
import HealthClient from "../health-client";
import { createDailyRecord, createInitialHealthState, shiftDateKey, todayKey, type HealthLocalState } from "../health-local-store";
import { saveHealthProfileRegistry, saveHealthProfileState } from "../health-profile-registry";
import type { HealthProfileRegistry } from "../health-profile-contracts";

function seededState(): HealthLocalState {
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
  state.reminders = [
    { id: "r-water", title: "Uống nước", category: "water", date: today, time: "09:30", repeat: "daily", enabled: true },
    { id: "r-move", title: "Vận động nhẹ", category: "activity", date: today, time: "16:00", repeat: "daily", enabled: true },
    { id: "r-sleep", title: "Đi ngủ", category: "care", date: today, time: "21:30", repeat: "daily", enabled: true },
  ];

  for (let offset = -6; offset <= 0; offset += 1) {
    const key = shiftDateKey(today, offset);
    const day = createDailyRecord();
    day.tasks = {
      breakfast: true,
      water: offset !== -4,
      movement: offset !== -2,
      teethMorning: true,
      teethEvening: offset !== -5,
      sleep: offset !== -3,
    };
    day.foodGroups = ["Đạm", "Rau", "Trái cây", "Sữa / tương đương", "Ngũ cốc / tinh bột", ...(offset % 2 === 0 ? ["Nước"] : [])];
    day.waterCups = 5 + ((offset + 6) % 3);
    day.meals = [{ id: `meal-${offset}`, meal: "breakfast", text: "Phở bò, sữa chua, chuối", createdAt: new Date().toISOString() }];
    day.activities = [{ id: `act-${offset}`, type: offset % 2 === 0 ? "Chạy" : "Đi bộ", minutes: 25 + (offset + 6) * 3, createdAt: new Date().toISOString() }];
    day.sleepStart = "21:30";
    day.sleepEnd = "06:30";
    day.eyeBreaks = 4;
    day.hygieneDone = true;
    day.feeling = "good";
    state.days[key] = day;
  }
  return state;
}

export default function VisualPreviewClient() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const now = new Date().toISOString();
    const primaryId = "preview-bao-anh";
    const secondaryId = "preview-be-minh";
    const registry: HealthProfileRegistry = {
      schemaVersion: 1,
      activeProfileId: primaryId,
      updatedAt: now,
      profiles: [
        { id: primaryId, displayName: "Bảo Anh", birthDate: "2013-07-25", sexForGrowthReference: "female", createdAt: now, updatedAt: now },
        { id: secondaryId, displayName: "Bé Minh", birthDate: "2025-08-09", sexForGrowthReference: "male", createdAt: now, updatedAt: now },
      ],
    };
    saveHealthProfileRegistry(registry);
    saveHealthProfileState(primaryId, seededState());
    const second = createInitialHealthState();
    second.profile = { name: "Bé Minh", birthDate: "2025-08-09", sex: "male", note: "" };
    saveHealthProfileState(secondaryId, second);
    setReady(true);
  }, []);

  if (!ready) return <div style={{ padding: 40 }}>Đang dựng preview…</div>;
  return <HealthClient initialCourse={{ preview: true }} device={{ deviceCode: "SK-PREVIEW", deviceType: "desktop", editEnabled: true, calendarEnabled: true }} />;
}
