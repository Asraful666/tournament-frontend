import PageHeader from "../components/PageHeader";
import MatchesManager from "../components/MatchesManager";
import { getSection } from "../config/navigation";
import { useAuth } from "../services/auth-store";
import { canEditSection, normalizeRole } from "../services/roles";

export default function MatchesPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const section = getSection("matches");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <MatchesManager readOnly={!canEditSection(role, "matches")} />
    </>
  );
}
