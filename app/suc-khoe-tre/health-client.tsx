"use client";

import HealthFramework, { type HealthDeviceAccess } from "./health-framework";
import HealthFrameworkMap from "./health-framework-map";

export default function HealthClient({ initialCourse, device }: { initialCourse: unknown; device: HealthDeviceAccess }) {
  // AgeContentCenter is intentionally nested inside the Today dashboard so it remains available without pushing the primary dashboard below the fold.
  return <>
    <HealthFrameworkMap />
    <HealthFramework initialCourse={initialCourse} device={device} />
  </>;
}
