import PageHeader from "../components/PageHeader";
import ResultsManager from "../components/ResultsManager";
import { getSection } from "../config/navigation";
import { useAuth } from "../services/auth-store";
import { canEditSection, normalizeRole } from "../services/roles";

export default function ResultsPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const section = getSection("results");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <ResultsManager
        readOnly={!canEditSection(role, "results")}
        role={role}
      />
    </>
  );
}
