"use client";

import { useState, useEffect } from "react";

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; text: string; border: string; bg: string; bar: string }
> = {
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500",
  },
  PROCESSING: {
    label: "Processing",
    dot: "bg-amber-400 animate-pulse",
    text: "text-amber-400",
    border: "border-amber-500/25",
    bg: "bg-amber-500/10",
    bar: "bg-amber-400",
  },
  PENDING: {
    label: "Pending",
    dot: "bg-zinc-500",
    text: "text-zinc-400",
    border: "border-zinc-700/60",
    bg: "bg-zinc-800/50",
    bar: "bg-zinc-600",
  },
  MISSED: {
    label: "Missed",
    dot: "bg-red-400",
    text: "text-red-400",
    border: "border-red-500/25",
    bg: "bg-red-500/10",
    bar: "bg-red-500",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-widest uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function LoadingDots() {
  return (
    <span className="flex items-center gap-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1 h-1 rounded-full bg-white/70 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

// ─── Progress bar derived from subTask completion ────────────────────────────
function TaskProgressBar({ task }: { task: any }) {
  const subs: any[] = task.subTasks ?? [];
  if (subs.length === 0) return null;

  const done = subs.filter((s) => s.status === "COMPLETED").length;
  const missed = subs.filter((s) => s.status === "MISSED").length;
  const pct = Math.round((done / subs.length) * 100);
  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.PENDING;

  return (
    <div className="mt-4 mb-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-600">
          Progress
        </span>
        <div className="flex items-center gap-3">
          {missed > 0 && (
            <span className="text-[10px] font-semibold text-red-500/80">
              {missed} missed
            </span>
          )}
          <span className="text-[11px] font-semibold tabular-nums text-zinc-400">
            {done}/{subs.length}
            <span className="text-zinc-600 ml-1">steps</span>
          </span>
          <span className={`text-[11px] font-bold tabular-nums ${cfg.text}`}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        {/* Missed segment (shown at the right of done) */}
        {missed > 0 && (
          <div
            className="absolute top-0 left-0 h-full bg-red-500/40 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(((done + missed) / subs.length) * 100)}%` }}
          />
        )}
        {/* Done segment */}
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${cfg.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step pips */}
      <div className="flex gap-1 mt-2">
        {subs.map((s, i) => (
          <div
            key={i}
            title={s.title}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              s.status === "COMPLETED"
                ? "bg-emerald-500"
                : s.status === "MISSED"
                ? "bg-red-500/60"
                : s.status === "PROCESSING"
                ? "bg-amber-400 animate-pulse"
                : "bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [input, setInput] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch tasks from the database
  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    if (Array.isArray(data)) setTasks(data);
  };

  // Poll the database every 3 seconds to catch backend updates
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawInput: input }),
    });

    setInput("");
    setLoading(false);
    fetchTasks();
  };

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const processingCount = tasks.filter((t) => t.status === "PROCESSING").length;
  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-64 left-1/3 w-[800px] h-[500px] rounded-full bg-indigo-600/8 blur-[140px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-[100px]" />
      </div>
      <header className="sticky top-0 z-20 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="4" height="4" rx="1" fill="white" />
                <rect x="7" y="1" width="4" height="4" rx="1" fill="white" fillOpacity="0.6" />
                <rect x="1" y="7" width="4" height="4" rx="1" fill="white" fillOpacity="0.6" />
                <rect x="7" y="7" width="4" height="4" rx="1" fill="white" fillOpacity="0.3" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Life Saver</span>
            <span className="hidden sm:inline text-[11px] text-zinc-600 font-mono border border-zinc-800 px-1.5 py-0.5 rounded">
              AI Queue
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live polling
            </span>
            {tasks.length > 0 && (
              <span className="text-zinc-600">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Two-column layout ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ══ LEFT COLUMN — Input panel (sticky) ══════════════════════════════ */}
          <aside className="w-full lg:w-[340px] xl:w-[380px] shrink-0 lg:sticky lg:top-[72px]">

            {/* Heading */}
            <div className="mb-5">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-indigo-400 mb-1">
                AI Job Queue
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
                Last-Minute<br />Life Saver
              </h1>
              <p className="text-sm text-zinc-500 leading-relaxed mt-1.5">
                Dump your panicked thoughts. The queue handles the rest.
              </p>
            </div>

            {/* Input card */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/5 p-5 mb-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <label
                  htmlFor="panic-input"
                  className="block text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500"
                >
                  What&apos;s on your mind?
                </label>
                <textarea
                  id="panic-input"
                  rows={5}
                  placeholder="e.g., I have my distributed systems final on June 28th and I haven't started. Also need to apply for jobs."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="w-full resize-none rounded-xl bg-zinc-800/60 border border-white/[0.06] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 min-h-[42px]"
                >
                  {loading ? (
                    <>
                      <LoadingDots />
                      <span>Queuing…</span>
                    </>
                  ) : (
                    "Rescue Me →"
                  )}
                </button>
              </form>
            </div>

            {/* Stats panel — only shown when tasks exist */}
            {tasks.length > 0 && (
              <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-4 space-y-3">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600">
                  Queue Summary
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Done", value: completedCount, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Active", value: processingCount, color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Waiting", value: pendingCount, color: "text-zinc-400", bg: "bg-zinc-800" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                      <p className="text-[10px] text-zinc-600 font-medium mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Overall progress across ALL subtasks */}
                {(() => {
                  const allSubs = tasks.flatMap((t) => t.subTasks ?? []);
                  if (allSubs.length === 0) return null;
                  const allDone = allSubs.filter((s) => s.status === "COMPLETED").length;
                  const overallPct = Math.round((allDone / allSubs.length) * 100);
                  return (
                    <div className="pt-1">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-600">
                          Overall
                        </span>
                        <span className="text-[11px] font-bold text-indigo-400">{overallPct}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${overallPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </aside>

          {/* ══ RIGHT COLUMN — Task feed ═════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Section label */}
            {tasks.length > 0 && (
              <div className="flex items-center gap-3 px-1">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600">
                  Active Tasks
                </p>
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-[10px] text-zinc-700 font-mono">{tasks.length}</span>
              </div>
            )}

            {tasks.map((task) => (
              <article
                key={task.id}
                className="bg-zinc-900/70 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden"
              >
                {/* Card header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <StatusBadge status={task.status} />
                    {task.urgency && (
                      <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md tracking-wide">
                        ⚡ {task.urgency}/10
                      </span>
                    )}
                  </div>
                  {task.deadline && (
                    <span className="text-xs text-zinc-500 font-medium tabular-nums">
                      Due&nbsp;
                      <span className="text-zinc-300">
                        {new Date(task.deadline).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  )}
                </div>

                <div className="px-5 pt-3 pb-4">
                  {/* Raw input quote */}
                  <blockquote className="pl-3 border-l-2 border-indigo-500/40 text-sm text-zinc-400 italic leading-relaxed mb-3">
                    &ldquo;{task.rawInput}&rdquo;
                  </blockquote>

                  {/* Progress bar */}
                  <TaskProgressBar task={task} />

                  {/* Sub-tasks */}
                  {task.subTasks && task.subTasks.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 mb-2.5">
                        Action Plan
                      </p>

                      {task.subTasks.map((sub: any) => {
                        const isMissed = sub.status === "MISSED";
                        const isDone = sub.status === "COMPLETED";

                        return (
                          <div
                            key={sub.id}
                            className={`group flex items-start justify-between gap-4 rounded-xl border px-4 py-3 transition-all duration-200
                              ${isDone
                                ? "bg-emerald-500/5 border-emerald-500/15 opacity-55"
                                : isMissed
                                ? "bg-red-500/5 border-red-500/15"
                                : "bg-zinc-800/40 border-white/[0.05] hover:border-indigo-500/25 hover:bg-zinc-800/70"
                              }`}
                          >
                            {/* Left: checkbox + text */}
                            <div className="flex items-start gap-3 min-w-0">
                              {/* Interactive Checkbox */}
                              <div className="pt-0.5 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={sub.status === "COMPLETED"}
                                  disabled={
                                    isMissed ||
                                    isDone ||
                                    task.status === "PROCESSING"
                                  }
                                  onChange={async (e) => {
                                    if (e.target.checked) {
                                      // Instantly update the database
                                      await fetch(`/api/subtasks/${sub.id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "COMPLETED" }),
                                      });
                                      // The 3-second polling useEffect will automatically fetch the fresh UI state
                                    }
                                  }}
                                  className="w-4 h-4 rounded bg-zinc-700 border-zinc-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer disabled:cursor-not-allowed accent-indigo-500 transition-colors"
                                />
                              </div>

                              {/* Task Content */}
                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-semibold leading-snug transition-all ${
                                    isDone
                                      ? "line-through text-zinc-600"
                                      : isMissed
                                      ? "line-through text-red-500/70"
                                      : "text-zinc-100"
                                  }`}
                                >
                                  <span className="text-zinc-700 mr-1.5 font-mono text-xs">
                                    {String(sub.order).padStart(2, "0")}.
                                  </span>
                                  {sub.title}
                                </p>
                                {sub.description && (
                                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                    {sub.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: timestamp */}
                            <div className="text-right shrink-0 flex flex-col items-end">
                              <span
                                className={`text-[10px] font-bold tracking-widest uppercase mb-0.5 ${
                                  isMissed ? "text-red-500/70" : "text-zinc-600"
                                }`}
                              >
                                {isMissed ? "Missed" : "By"}
                              </span>
                              <span
                                className={`text-xs font-medium tabular-nums ${
                                  isMissed ? "text-red-400" : "text-zinc-300"
                                }`}
                              >
                                {new Date(sub.deadline).toLocaleString("en-IN", {
                                  timeZone: "Asia/Kolkata",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            ))}

            {/* Empty state */}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-500">Nothing in the queue.</p>
                <p className="text-xs text-zinc-700 mt-1 max-w-xs leading-relaxed">
                  Submit a task on the left and watch the AI orchestration pipeline go to work.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}