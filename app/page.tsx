"use client";

import { useState, useEffect } from "react";

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
    fetchTasks(); // Instantly refresh to show the new 'PENDING' task
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">The Last-Minute Life Saver</h1>
          <p className="text-gray-500 mb-4">Dump your panicked thoughts below. We will handle the rest.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              rows={4}
              placeholder="e.g., I have my distributed systems final on June 28th and I haven't started. Also need to apply for jobs."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending to Queue..." : "Rescue Me"}
            </button>
          </form>
        </div>
        <div className="space-y-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                      task.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-gray-100 text-gray-700'}`}>
                    {task.status}
                  </span>
                  {task.urgency && (
                    <span className="ml-2 text-sm font-medium text-red-500">
                      Urgency: {task.urgency}/10
                    </span>
                  )}
                </div>
                {task.deadline && (
                  <span className="text-sm font-medium text-gray-500">
                    Hard Deadline: {new Date(task.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <p className="text-gray-700 italic mb-6 border-l-4 border-blue-200 pl-4">"{task.rawInput}"</p>

              {/* Sub-Tasks List */}
              {task.subTasks && task.subTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Action Plan</h3>
                  {task.subTasks.map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">{sub.order}. {sub.title}</p>
                        {sub.description && <p className="text-sm text-gray-500 mt-1">{sub.description}</p>}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-500 block">Complete By:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(sub.deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}