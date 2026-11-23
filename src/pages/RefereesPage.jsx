import PageHeader from "../components/PageHeader";
import SimpleResourceManager from "../components/SimpleResourceManager";
import { getSection } from "../config/navigation";
import { useAuth } from "../services/auth-store";
import { canEditSection, normalizeRole } from "../services/roles";

export default function RefereesPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const section = getSection("referees");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <SimpleResourceManager
        resource="referees"
        readOnly={!canEditSection(role, "referees")}
      />
    </>
  );
}
