"use client";

import HealthFramework, { type HealthDeviceAccess } from "./health-framework";

export default function HealthClient({ initialCourse, device }: { initialCourse: unknown; device: HealthDeviceAccess }) {
  // AgeContentCenter is nested inside Today; the engineering maturity map remains a source file/validator aid and is not an end-user dashboard block.
  return <HealthFramework initialCourse={initialCourse} device={device} />;
}
