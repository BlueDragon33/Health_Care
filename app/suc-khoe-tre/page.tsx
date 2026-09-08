import HealthDeviceGate from "./device-gate";
import "./health-framework.css";
import "./health-polish.css";
import "./growth-trend.css";
import "./weekly-health-summary.css";
import "./control-plane.css";

export const dynamic = "force-dynamic";

export default function ChildHealthPage() {
  return <HealthDeviceGate />;
}
