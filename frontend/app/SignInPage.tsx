"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetNotice = () => {
    setMessage(null);
    setError(null);
  };

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetNotice();

    if (!supabase) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env",
      );
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage("Signed in. Redirecting to trading terminal...");
    router.push("/trade");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080a12] text-[#e5e7eb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-[-100px] h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-[-80px] top-16 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-6">
        <section className="grid w-full overflow-hidden rounded-2xl border border-[#151a27] bg-[#0c0f17]/90 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur md:grid-cols-2">
          <div className="hidden border-r border-[#151a27] p-8 md:block">
            <div className="mb-6 inline-flex items-center gap-3 rounded-lg border border-[#1a1f2e] bg-[#0a0d14] px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 font-black text-[#0a0d14]">
                M
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  MIG Quant Competition
                </p>
                <p className="text-xs text-[#4b5563]">Michigan Investment Group</p>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
              Enter the terminal.
            </h1>
            <p className="mt-3 max-w-sm text-sm text-[#9ca3af]">
              Authenticate, then continue to your live trading UI.
            </p>

            <div className="mt-10 space-y-4">
              <div
                  className="flex items-center gap-3 rounded-md border border-[#1a1f2e] bg-[#0a0d14] px-3 py-2"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-sm text-[#cbd5e1]">Status: Live</span>
                </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b5563]">
                Sign In
              </p>
              <Link
                href="/trade"
                className="rounded-md border border-[#1a1f2e] px-3 py-1 text-xs text-[#9ca3af] transition hover:border-[#6C8EFF] hover:text-[#e5e7eb]"
              >
                View UI
              </Link>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-[#4b5563]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#1a1f2e] bg-[#0a0d14] px-3 py-2.5 text-sm text-[#e5e7eb] outline-none transition placeholder:text-[#374151] focus:border-[#6C8EFF]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-[#4b5563]">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-md border border-[#1a1f2e] bg-[#0a0d14] px-3 py-2.5 text-sm text-[#e5e7eb] outline-none transition placeholder:text-[#374151] focus:border-[#6C8EFF]"
                  placeholder="At least 6 characters"
                />
              </div>

              {error && (
                <p className="rounded-md border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {error}
                </p>
              )}

              {message && (
                <p className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0a0d14] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Sign In"}
              </button>
            </form>

          </div>
        </section>
      </div>
    </main>
  );
}
