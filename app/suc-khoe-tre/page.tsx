import HealthDeviceGate from "./device-gate";
import "./health-framework.css";
import "./health-polish.css";
import "./growth-trend.css";
import "./weekly-health-summary.css";
import "./health-timeline.css";
import "./reminder-manager.css";
import "./attention-queue.css";
import "./profile-switcher.css";
import "./privacy-center.css";
import "./secure-vault-center.css";
import "./control-plane.css";

export const dynamic = "force-dynamic";

export default function ChildHealthPage() {
  return <HealthDeviceGate />;
}
