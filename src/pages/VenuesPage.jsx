import PageHeader from "../components/PageHeader";
import SimpleResourceManager from "../components/SimpleResourceManager";
import { getSection } from "../config/navigation";
import { useAuth } from "../services/auth-store";
import { canEditSection, normalizeRole } from "../services/roles";

export default function VenuesPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const section = getSection("venues");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <SimpleResourceManager
        resource="venues"
        readOnly={!canEditSection(role, "venues")}
      />
    </>
  );
}
