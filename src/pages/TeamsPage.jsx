import PageHeader from "../components/PageHeader";
import TeamsManager from "../components/TeamsManager";
import { getSection } from "../config/navigation";
import { useAuth } from "../services/auth-store";
import { canEditSection, normalizeRole, ROLES } from "../services/roles";

export default function TeamsPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const section = getSection("teams");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <TeamsManager
        readOnly={!canEditSection(role, "teams")}
        ownTeamId={role === ROLES.team_manager ? user?.team : null}
      />
    </>
  );
}
