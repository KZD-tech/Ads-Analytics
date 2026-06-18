"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirectPath);
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Ad Analytics</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Log masuk ke dashboard anda
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-8">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              E-mel
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="anda@email.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Kata laluan
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Log masuk..." : "Log Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Belum ada akaun?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="text-text-secondary">Memuatkan...</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}