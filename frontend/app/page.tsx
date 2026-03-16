"use client";

import { SyntheticEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useBackendStatus } from "@/lib/useBackendStatus";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { status: wsStatus } = useBackendStatus();

  const resetNotice = () => {
    setMessage(null);
    setError(null);
  };

  const handleAuth = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetNotice();

    if (!supabase) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env",
      );
      return;
    }

    setLoading(true);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/trade");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080a12] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-[-100px] h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-[-80px] top-16 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center p-6">
        <section className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#151a27] bg-[#0c0f17]/90 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="border-b border-[#151a27] p-8">
            <div className="mb-6 inline-flex items-center gap-3 rounded-lg border border-[#1a1f2e] bg-[#0a0d14] px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 font-black text-[#0a0d14]">
                M
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight text-white">
                  MIG Quant Competition
                </p>
                <p className="text-sm text-white/60">Michigan Investment Group</p>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
              Enter the terminal.
            </h1>
            <p className="mt-3 max-w-sm text-base text-white/70">
              Authenticate to enter your live trading UI.
            </p>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3 rounded-md border border-[#1a1f2e] bg-[#0a0d14] px-3 py-2">
                <span className={`h-2 w-2 rounded-full ${wsStatus === "live" ? "bg-emerald-400" : wsStatus === "offline" ? "bg-rose-500" : "bg-yellow-400 animate-pulse"}`} />
                <span className="text-base text-white">
                  Backend:{" "}
                  <span className={wsStatus === "live" ? "text-emerald-400" : wsStatus === "offline" ? "text-rose-400" : "text-yellow-300"}>
                    {wsStatus === "live" ? "Live" : wsStatus === "offline" ? "Offline" : "Checking..."}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Sign In
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm uppercase tracking-[0.15em] text-white/70">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#1a1f2e] bg-[#0a0d14] px-3 py-2.5 text-base text-white outline-none transition placeholder:text-white/25 focus:border-[#6C8EFF]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm uppercase tracking-[0.15em] text-white/70">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-md border border-[#1a1f2e] bg-[#0a0d14] px-3 py-2.5 text-base text-white outline-none transition placeholder:text-white/25 focus:border-[#6C8EFF]"
                  placeholder="At least 6 characters"
                />
              </div>

              {error && (
                <p className="rounded-md border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-base text-rose-300">
                  {error}
                </p>
              )}

              {message && (
                <p className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-base text-emerald-300">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2.5 text-base font-bold text-[#0a0d14] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Sign In"}
              </button>
            </form>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#1a1f2e]" />
              <span className="text-xs text-white/25">or</span>
              <div className="h-px flex-1 bg-[#1a1f2e]" />
            </div>

            <button
              type="button"
              onClick={() => router.push("/view")}
              className="mt-3 w-full rounded-md border border-[#1a1f2e] bg-transparent px-4 py-2.5 text-sm font-semibold text-white/50 transition hover:border-[#6C8EFF]/40 hover:text-[#6C8EFF]"
            >
              View Live Feed
            </button>

          </div>
        </section>
      </div>
    </main>
  );
}
