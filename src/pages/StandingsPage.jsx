import PageHeader from "../components/PageHeader";
import StandingsManager from "../components/StandingsManager";
import { getSection } from "../config/navigation";
import { useAuth } from "../services/auth-store";
import { canEditSection, normalizeRole } from "../services/roles";

export default function StandingsPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const section = getSection("standings");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <StandingsManager readOnly={!canEditSection(role, "standings")} />
    </>
  );
}
