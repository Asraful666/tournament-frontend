import PageHeader from "../components/PageHeader";
import PlayersManager from "../components/PlayersManager";
import { getSection } from "../config/navigation";
import { useAuth } from "../services/auth-store";
import { canEditSection, normalizeRole, ROLES } from "../services/roles";

export default function PlayersPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const section = getSection("players");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <PlayersManager
        readOnly={!canEditSection(role, "players")}
        ownTeamId={role === ROLES.team_manager ? user?.team : null}
      />
    </>
  );
}
