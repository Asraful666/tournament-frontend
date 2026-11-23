import PageHeader from "../components/PageHeader";
import UserManager from "../components/UserManager";
import { getSection } from "../config/navigation";

export default function UsersPage() {
  const section = getSection("users");

  return (
    <>
      <PageHeader title={section.title} subtitle={section.subtitle} />
      <UserManager />
    </>
  );
}
