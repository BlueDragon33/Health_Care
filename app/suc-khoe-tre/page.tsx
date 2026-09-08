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
import "./secure-vault-backup-center.css";
import "./medications-allergies.css";
import "./vital-signs-screening.css";
import "./chronic-conditions-care-plans.css";
import "./preventive-care-records.css";
import "./private-sensitive-notes.css";
import "./control-plane.css";
import "./premium-health-ui.css";
import "./premium-health-ui-v2.css";

export const dynamic = "force-dynamic";

export default function ChildHealthPage() {
  return <HealthDeviceGate />;
}