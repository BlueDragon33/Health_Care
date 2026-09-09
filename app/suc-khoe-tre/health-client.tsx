"use client";

import HealthFramework, { type HealthDeviceAccess } from "./health-framework";
import HealthFrameworkMap from "./health-framework-map";
import AdvancedHealthModules from "./advanced-health-modules";

export default function HealthClient({ initialCourse, device }: { initialCourse: unknown; device: HealthDeviceAccess }) {
  return <>
    <HealthFrameworkMap />
    <AdvancedHealthModules />
    <HealthFramework initialCourse={initialCourse} device={device} />
  </>;
}
