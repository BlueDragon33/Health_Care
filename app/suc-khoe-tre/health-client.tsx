"use client";

import HealthFramework, { type HealthDeviceAccess } from "./health-framework";
import HealthFrameworkMap from "./health-framework-map";
import AgeContentCenter from "./age-content-center";

export default function HealthClient({ initialCourse, device }: { initialCourse: unknown; device: HealthDeviceAccess }) {
  return <>
    <HealthFrameworkMap />
    <div className="ac-shell-dock">
      <AgeContentCenter />
    </div>
    <HealthFramework initialCourse={initialCourse} device={device} />
  </>;
}
