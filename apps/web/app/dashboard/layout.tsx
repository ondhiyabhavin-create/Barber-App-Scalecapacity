import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoleSwitcherBar } from "@/components/dev/role-switcher-bar";

export const dynamic = "force-dynamic";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return children;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const showDevRoleSwitcher =
    process.env.NEXT_PUBLIC_ENABLE_DEV_ROLE_SWITCHER === "true" ||
    (process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_ENABLE_DEV_ROLE_SWITCHER !== "false");

  return (
    <>
      {children}
      {showDevRoleSwitcher ? <RoleSwitcherBar /> : null}
    </>
  );
}
