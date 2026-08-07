import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../../lib/api";
import { Flower, Spark, Blob, CurvedArrow, Tape } from "../decor";
import { EASE } from "../../lib/motion";

interface Props {
  onJobStarted: (jobId: string) => void;
}

export function UploadView({ onJobStarted }: Props) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const res = await api.uploads.resume(file);
      onJobStarted(res.data.job.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-[80vh] place-items-center px-5 py-10">
      <div className="notebook-lines absolute inset-0 opacity-30" aria-hidden="true" />
      <Flower className="absolute left-[6%] top-[10%] h-16 w-16 animate-floaty" />
      <Spark className="absolute right-[8%] top-[16%] h-10 w-10 animate-wiggle" />
      <Blob className="absolute right-[-8%] bottom-[8%] h-80 w-80" tone="#B9E4F4" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative w-full max-w-xl text-center"
      >
        <span className="kicker text-coral">step 01 · the offering</span>
        <h1 className="mt-4 display-1 text-[clamp(2rem,5vw,3.2rem)]">
          Hand me your resume.
          <br />
          <span className="italic text-forest">I'll handle the rest.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-navy/60">
          Drop a PDF or DOCX below. It's validated, read, polished and published
          to a live URL — no code, no templates, no hassle.
        </p>

        <motion.div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          animate={dragging ? { scale: 1.02 } : { scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3, ease: EASE }}
          className={`relative mx-auto mt-10 cursor-pointer rounded-[2rem] border-2 border-dashed p-10 transition-colors md:p-14 ${
            dragging ? "border-forest bg-sage/30" : "border-navy/25 bg-paper/70"
          }`}
          role="button"
          tabIndex={0}
          aria-label="Upload your resume"
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          {busy && <Tape className="-top-3 left-1/2 -translate-x-1/2" variant="blue" />}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-butter border border-navy/10 shadow-sticker" style={{ transform: "rotate(-6deg)" }}>
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="#24305E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 16V4m0 0 5 5m-5-5L7 9" />
              <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
          </div>
          <p className="mt-5 font-display text-xl font-semibold">
            {busy ? "Uploading & analysing…" : dragging ? "Let go — perfect." : "Drop your resume here"}
          </p>
          <p className="mt-1 text-sm text-navy/50">
            or <span className="font-bold text-forest underline underline-offset-2">browse files</span> · PDF or DOCX · up to 15 MB
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["confidential", "scanned", "structured"].map((t) => (
              <span key={t} className="rounded-full bg-ivory px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-navy/50 border border-navy/10">
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        {error && (
          <p className="mt-5 rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold text-coral" role="alert">
            {error}
          </p>
        )}

        <div className="relative mx-auto mt-10 max-w-xs">
          <CurvedArrow className="absolute -left-24 -top-4 h-16 w-16" />
          <p className="scribble text-2xl text-navy/50">your future self says thank you</p>
        </div>
      </motion.div>
    </div>
  );
}
