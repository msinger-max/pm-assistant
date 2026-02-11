"use client";

import { useState } from "react";

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  selected: boolean;
}

interface TranscriptProcessorProps {
  darkMode?: boolean;
}

export default function TranscriptProcessor({ darkMode = false }: TranscriptProcessorProps) {
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isCreatingTickets, setIsCreatingTickets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    setError(null);
    setActionItems([]);

    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to process transcript.");
      }

      setActionItems(data.items ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process transcript.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItem = (id: string) => {
    setActionItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleCreateTickets = async () => {
    const selectedItems = actionItems.filter((item) => item.selected);
    if (selectedItems.length === 0) return;

    setIsCreatingTickets(true);

    // TODO: Connect to Jira API
    setTimeout(() => {
      alert(`Created ${selectedItems.length} tickets in Jira!`);
      setIsCreatingTickets(false);
      setActionItems([]);
      setTranscript("");
    }, 1000);
  };

  const priorityColors = {
    high: darkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700",
    medium: darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700",
    low: darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700",
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Process Transcript</h2>
        <p className={darkMode ? "text-slate-400" : "text-gray-500"}>
          Paste your meeting transcript and extract action items
        </p>
      </div>

      {/* Transcript Input */}
      <div className="mb-6">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste your Granola transcript here..."
          className={`w-full h-48 p-4 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all ${
            darkMode
              ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              : "bg-white border border-gray-300 text-gray-900"
          }`}
        />
        <button
          onClick={handleProcess}
          disabled={isProcessing || !transcript.trim()}
          className="mt-3 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
        >
          {isProcessing ? "Processing..." : "Extract Action Items"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Action Items Found
          </h3>

          <div className="space-y-3 mb-6">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  item.selected
                    ? darkMode
                      ? "border-violet-500/50 bg-violet-900/20"
                      : "border-blue-200 bg-blue-50"
                    : darkMode
                      ? "border-slate-700 bg-slate-800/50"
                      : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleItem(item.id)}
                  className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <div className="flex-1">
                  <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{item.task}</p>
                  <p className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}>Assignee: {item.assignee}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[item.priority]}`}
                >
                  {item.priority}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreateTickets}
              disabled={isCreatingTickets || !actionItems.some((i) => i.selected)}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25"
            >
              {isCreatingTickets
                ? "Creating..."
                : `Create ${actionItems.filter((i) => i.selected).length} Jira Tickets`}
            </button>
            <button
              onClick={() => setActionItems([])}
              className={`px-6 py-2.5 rounded-xl transition-colors border ${
                darkMode
                  ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Clear
            </button>
          </div>
        </div>
      )}
      {!isProcessing && !error && actionItems.length === 0 && (
        <p className={`text-sm ${darkMode ? "text-slate-500" : "text-gray-500"}`}>No action items yet.</p>
      )}
    </div>
  );
}
