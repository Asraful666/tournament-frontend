import PageHeader from "../components/PageHeader";
import AssignmentsManager from "../components/AssignmentsManager";
import { getSection } from "../config/navigation";
import { useAuth } from "../services/auth-store";
import { canEditSection, normalizeRole } from "../services/roles";

export default function MatchTeamsPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const section = getSection("match-teams");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <AssignmentsManager
        resource="match-teams"
        readOnly={!canEditSection(role, "match-teams")}
      />
    </>
  );
}
