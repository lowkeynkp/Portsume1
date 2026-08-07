import { motion } from "framer-motion";
import { useState } from "react";
import { api, setToken } from "../../lib/api";
import { Logo } from "../landing/Nav";
import { Flower, Spark, Blob, DoodleCircle } from "../decor";
import { EASE } from "../../lib/motion";

interface Props {
  onAuthed: () => void;
}

export function AuthGate({ onAuthed }: Props) {
  const [busy, setBusy] = useState<"demo" | "google" | null>(null);
  const [error, setError] = useState("");

  async function demo() {
    setBusy("demo");
    setError("");
    try {
      const res = await api.auth.demo();
      setToken(res.data.token);
      onAuthed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start a demo session");
      setBusy(null);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5">
      <div className="wash absolute inset-0" aria-hidden="true" />
      <div className="dotted-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <Flower className="absolute left-[8%] top-[14%] h-16 w-16 animate-floaty" />
      <Spark className="absolute right-[12%] top-[22%] h-10 w-10 animate-wiggle" />
      <Blob className="absolute bottom-[-8%] left-[-6%] h-80 w-80" tone="#F8CCD6" />
      <DoodleCircle className="absolute bottom-[14%] right-[8%] h-28 w-28" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-[2rem] border border-navy/10 bg-paper/85 p-8 shadow-lift backdrop-blur-sm">
          <span className="kicker text-coral">the studio</span>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight">
            Come on in,
            <br />
            <em className="italic text-forest">your portfolio</em> is waiting.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-navy/60">
            Sign in to upload a resume and watch it become a live website. This is a demo build —
            one click and you're in.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <button
              onClick={demo}
              disabled={busy !== null}
              className="btn-primary w-full disabled:opacity-60"
            >
              {busy === "demo" ? "Setting up your studio…" : "Try the live demo →"}
            </button>
            <button
              onClick={() => {
                setBusy("google");
                setTimeout(() => {
                  demo();
                }, 400);
              }}
              disabled={busy !== null}
              className="btn-paper w-full disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.2c1.9-1.8 3-4.4 3-7.5Z" />
                <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z" />
                <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3a10 10 0 0 0 0 9l3.4-2.5Z" />
                <path fill="#EA4335" d="M12 6.2c1.5 0 2.8.5 3.8 1.5L18.6 5A10 10 0 0 0 3 7.5l3.4 2.6C7.2 8 9.4 6.2 12 6.2Z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-coral/15 px-3 py-2 text-xs font-semibold text-coral" role="alert">
              {error}
            </p>
          )}

          <p className="mt-6 text-center text-[11px] leading-relaxed text-navy/40">
            By continuing you agree to the Portsume terms.
            <br />
            Resumes are never shared and can be deleted anytime.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
