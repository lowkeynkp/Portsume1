import { useCallback, useEffect, useState } from "react";
import type { Portfolio } from "@portsume/shared";
import { api, getToken, setToken } from "../lib/api";
import { Logo } from "../components/landing/Nav";
import { AuthGate } from "../components/dashboard/AuthGate";
import { UploadView } from "../components/dashboard/UploadView";
import { PipelineView } from "../components/dashboard/PipelineView";
import { TemplateSelectView } from "../components/dashboard/TemplateSelectView";
import { EditorView } from "../components/dashboard/EditorView";
import { PublishedView } from "../components/dashboard/PublishedView";

type Stage = "auth" | "upload" | "pipeline" | "template" | "editor" | "published";

interface DashboardState {
  stage: Stage;
  jobId?: string;
  portfolio: Portfolio | null;
}

export function Dashboard() {
  const [state, setState] = useState<DashboardState>({ stage: "auth", portfolio: null });
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (getToken()) {
      setAuthed(true);
      api.portfolios
        .list()
        .then((res) => {
          if (res.data.portfolios.length > 0) {
            setState({ stage: "editor", portfolio: res.data.portfolios[0]! });
          } else {
            setState({ stage: "upload", portfolio: null });
          }
        })
        .catch(() => {
          // request() clears the token on 401; if it's gone the session was
          // rejected, so send the user back through the auth gate.
          if (!getToken()) {
            setAuthed(false);
            setState({ stage: "auth", portfolio: null });
            return;
          }
          setState({ stage: "upload", portfolio: null });
        });
    }
  }, []);

  const handleAuthed = useCallback(() => {
    setAuthed(true);
    setState({ stage: "upload", portfolio: null });
  }, []);

  const handleJobStarted = useCallback((jobId: string) => {
    setState({ stage: "pipeline", jobId, portfolio: null });
  }, []);

  const handleDone = useCallback((portfolioId: string) => {
    api.portfolios.get(portfolioId).then((res) => {
      setState({ stage: "template", portfolio: res.data.portfolio });
    });
  }, []);

  const handleTemplate = useCallback((portfolio: Portfolio) => {
    setState({ stage: "editor", portfolio });
  }, []);

  const handlePublished = useCallback((portfolio: Portfolio) => {
    setState({ stage: "published", portfolio });
  }, []);

  if (!authed) return <AuthGate onAuthed={handleAuthed} />;

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Studio nav">
              {[
                ["New", "upload"],
                ["Portfolios", "editor"],
              ].map(([label, key]) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "editor" && !state.portfolio) {
                      setState({ stage: "upload", portfolio: null });
                      return;
                    }
                    setState({ stage: key as Stage, portfolio: state.portfolio });
                  }}
                  className={`kicker rounded-full px-3 py-1.5 transition-colors ${
                    state.stage === key ? "bg-navy text-cream" : "text-navy/60 hover:text-navy"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {state.stage === "editor" && state.portfolio?.status === "published" && (
              <a href={state.portfolio.publishedUrl} target="_blank" rel="noopener noreferrer" className="kicker text-forest">
                View live ↗
              </a>
            )}
            <button
              onClick={() => {
                setToken(null);
                setAuthed(false);
                setState({ stage: "auth", portfolio: null });
              }}
              className="kicker rounded-full border border-navy/15 px-3 py-1.5 text-navy/60 hover:text-navy"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main>
        {state.stage === "upload" && <UploadView onJobStarted={handleJobStarted} />}
        {state.stage === "pipeline" && state.jobId && <PipelineView jobId={state.jobId} onDone={handleDone} />}
        {state.stage === "template" && state.portfolio && (
          <TemplateSelectView portfolio={state.portfolio} onSelect={handleTemplate} />
        )}
        {state.stage === "editor" && state.portfolio && (
          <EditorView portfolio={state.portfolio} onPublished={handlePublished} />
        )}
        {state.stage === "published" && state.portfolio && (
          <PublishedView portfolio={state.portfolio} onEdit={() => setState({ stage: "editor", portfolio: state.portfolio })} />
        )}
      </main>
    </div>
  );
}
