import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-danger mb-2">Debug: Missing Env Vars</h2>
          <p className="text-sm text-text-primary font-mono">
            Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.
            Add them in Vercel → Settings → Environment Variables.
          </p>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[dashboard/layout] getUser error:", userError.message);
    return (
      <div className="p-8">
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-danger mb-2">Debug: Auth Error</h2>
          <p className="text-sm text-text-primary font-mono break-all">{userError.message}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  return <DashboardShell email={user.email ?? ""}>{children}</DashboardShell>;
}