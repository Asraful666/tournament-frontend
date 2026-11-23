import PageHeader from "../components/PageHeader";
import TournamentsManager from "../components/TournamentsManager";
import { getSection } from "../config/navigation";
import { useAuth } from "../services/auth-store";
import { canEditSection, normalizeRole } from "../services/roles";

export default function TournamentsPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const section = getSection("tournaments");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <TournamentsManager
        readOnly={!canEditSection(role, "tournaments")}
        role={role}
        currentUserId={user?.user_id}
      />
    </>
  );
}
