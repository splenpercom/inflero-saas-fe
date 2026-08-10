import { useAuth } from "../../../app/context/AuthContext";
import { MyWebsite } from "../features/builder";

export function MyWebsitePage() {
  const { user } = useAuth();
  return (
    <MyWebsite
      tenantId={user?.tenant?.id ?? null}
      companySlug={user?.tenant?.slug ?? null}
    />
  );
}
