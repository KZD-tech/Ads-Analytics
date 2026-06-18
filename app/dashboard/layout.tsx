import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Add them in Vercel → Settings → Environment Variables.",
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
    }

    if (!user) {
      redirect("/login");
    }

    return <DashboardShell email={user.email ?? ""}>{children}</DashboardShell>;
  } catch (err) {
    // In production, Vercel hides the actual error. Log it so we can see it
    // in Vercel logs, and re-throw with a descriptive message that the
    // error boundary will display.
    console.error("[dashboard/layout] FATAL:", err);
    throw err;
  }
}