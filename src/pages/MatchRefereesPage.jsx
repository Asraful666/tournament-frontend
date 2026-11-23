import PageHeader from "../components/PageHeader";
import AssignmentsManager from "../components/AssignmentsManager";
import { getSection } from "../config/navigation";
import { useAuth } from "../services/auth-store";
import { canEditSection, normalizeRole } from "../services/roles";

export default function MatchRefereesPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const section = getSection("match-referees");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <AssignmentsManager
        resource="match-referees"
        readOnly={!canEditSection(role, "match-referees")}
      />
    </>
  );
}
