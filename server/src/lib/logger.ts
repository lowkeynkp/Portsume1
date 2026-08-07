import { config } from "../config/index.js";

type Level = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: Level;
  msg: string;
  time: string;
  trace?: string;
  [key: string]: unknown;
}

class Logger {
  private enabledLevels: Record<Level, boolean>;

  constructor() {
    const threshold: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
    const current: Record<Level, number> = {
      debug: 10,
      info: 20,
      warn: 30,
      error: 40,
    };
    const min = config.env === "test" ? 30 : config.isDev ? 10 : 20;
    this.enabledLevels = Object.fromEntries(
      (Object.keys(threshold) as Level[]).map((l) => [l, current[l]! >= min]),
    ) as Record<Level, boolean>;
  }

  private write(level: Level, msg: string, ctx?: Record<string, unknown>): void {
    if (!this.enabledLevels[level]) return;
    const entry: LogEntry = { level, msg, time: new Date().toISOString(), ...ctx };
    const line = config.isDev ? this.pretty(entry) : JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  private pretty(e: LogEntry): string {
    const time = new Date(e.time).toLocaleTimeString("en-US", { hour12: false });
    const label = `[${e.level.toUpperCase()}]`.padEnd(8);
    const base = `${time} ${label} ${e.msg}`;
    const extra = Object.entries(e)
      .filter(([k]) => !["level", "msg", "time"].includes(k))
      .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(" ");
    return extra ? `${base} ${extra}` : base;
  }

  child(scope: string): Logger {
    return new ScopedLogger(this, scope);
  }

  debug(msg: string, ctx?: Record<string, unknown>): void {
    this.write("debug", msg, ctx);
  }
  info(msg: string, ctx?: Record<string, unknown>): void {
    this.write("info", msg, ctx);
  }
  warn(msg: string, ctx?: Record<string, unknown>): void {
    this.write("warn", msg, ctx);
  }
  error(msg: string, ctx?: Record<string, unknown>): void {
    this.write("error", msg, ctx);
  }
}

class ScopedLogger extends Logger {
  constructor(
    private readonly parent: Logger,
    private readonly scope: string,
  ) {
    super();
  }

  override child(sub: string): Logger {
    return new ScopedLogger(this.parent, `${this.scope}.${sub}`);
  }

  private withScope(ctx?: Record<string, unknown>): Record<string, unknown> {
    return { scope: this.scope, ...ctx };
  }

  override debug(msg: string, ctx?: Record<string, unknown>): void {
    this.parent.debug(msg, this.withScope(ctx));
  }
  override info(msg: string, ctx?: Record<string, unknown>): void {
    this.parent.info(msg, this.withScope(ctx));
  }
  override warn(msg: string, ctx?: Record<string, unknown>): void {
    this.parent.warn(msg, this.withScope(ctx));
  }
  override error(msg: string, ctx?: Record<string, unknown>): void {
    this.parent.error(msg, this.withScope(ctx));
  }
}

export const logger = new Logger();
