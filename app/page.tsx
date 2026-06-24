"use client";

import { useState, useEffect } from "react";

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; text: string; border: string; bg: string }
> = {
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
  PROCESSING: {
    label: "Processing",
    dot: "bg-amber-400 animate-pulse",
    text: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  PENDING: {
    label: "Pending",
    dot: "bg-zinc-500",
    text: "text-zinc-400",
    border: "border-zinc-600/40",
    bg: "bg-zinc-700/30",
  },
  MISSED: {
    label: "Missed",
    dot: "bg-red-400",
    text: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
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

export default function Dashboard() {
  const [input, setInput] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    if (Array.isArray(data)) setTasks(data);
  };

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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-64 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 space-y-10">
        <header className="space-y-1">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-indigo-400">
            AI Job Queue
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Last-Minute Life Saver
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed pt-0.5">
            Dump your panicked thoughts. The queue handles the rest.
          </p>
        </header>
        <section className="bg-zinc-900/70 backdrop-blur-sm rounded-2xl border border-white/5 p-6 shadow-xl shadow-black/30">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label
              htmlFor="panic-input"
              className="block text-xs font-semibold tracking-widest uppercase text-zinc-500"
            >
              What&apos;s on your mind?
            </label>
            <textarea
              id="panic-input"
              rows={4}
              placeholder="e.g., I have my distributed systems final on June 28th and I haven't started. Also need to apply for jobs."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="w-full resize-none rounded-xl bg-zinc-800/60 border border-white/8 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-transparent transition-all duration-200 disabled:opacity-50"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-900/40 min-w-[130px]"
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
            </div>
          </form>
        </section>
        {tasks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-600 px-1">
              Active Tasks — {tasks.length}
            </h2>

            {tasks.map((task) => (
              <article
                key={task.id}
                className="bg-zinc-900/70 backdrop-blur-sm rounded-2xl border border-white/5 shadow-xl shadow-black/20 overflow-hidden"
              >
                {/* Card header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={task.status} />
                    {task.urgency && (
                      <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md tracking-wide">
                        ⚡ Urgency {task.urgency}/10
                      </span>
                    )}
                  </div>
                  {task.deadline && (
                    <span className="text-xs text-zinc-500 font-medium">
                      Deadline&nbsp;
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

                {/* Raw input quote */}
                <blockquote className="mx-6 mt-4 mb-2 pl-3.5 border-l-2 border-indigo-500/50 text-sm text-zinc-400 italic leading-relaxed">
                  &ldquo;{task.rawInput}&rdquo;
                </blockquote>

                {/* Sub-tasks */}
                {task.subTasks && task.subTasks.length > 0 && (
                  <div className="px-6 pb-5 mt-4">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 mb-3">
                      Action Plan
                    </p>

                    <div className="space-y-2">
                      {task.subTasks.map((sub: any) => {
                        const isMissed = sub.status === "MISSED";
                        const isDone = sub.status === "COMPLETED";

                        return (
                          <div
                            key={sub.id}
                            className={`group flex items-start justify-between gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200
                              ${isDone
                                ? "bg-emerald-500/5 border-emerald-500/15 opacity-60"
                                : isMissed
                                ? "bg-red-500/5 border-red-500/15"
                                : "bg-zinc-800/50 border-white/6 hover:border-indigo-500/30 hover:bg-zinc-800/80"
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
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          status: "COMPLETED",
                                        }),
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
                                  <span className="text-zinc-600 mr-1.5 font-mono text-xs">
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
                                {new Date(sub.deadline).toLocaleString(
                                  "en-IN",
                                  {
                                    timeZone: "Asia/Kolkata",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center mb-4 text-2xl">
              🗂
            </div>
            <p className="text-sm font-medium text-zinc-400">No tasks yet.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Submit something above and watch the queue go to work.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}