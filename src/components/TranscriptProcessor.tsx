"use client";

import { useState } from "react";

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  selected: boolean;
}

export default function TranscriptProcessor() {
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
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Process Transcript</h2>
        <p className="text-gray-500">
          Paste your meeting transcript and extract action items
        </p>
      </div>

      {/* Transcript Input */}
      <div className="mb-6">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste your Granola transcript here..."
          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
        />
        <button
          onClick={handleProcess}
          disabled={isProcessing || !transcript.trim()}
          className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? "Processing..." : "Extract Action Items"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Action Items Found
          </h3>

          <div className="space-y-3 mb-6">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  item.selected ? "border-blue-200 bg-blue-50" : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleItem(item.id)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.task}</p>
                  <p className="text-sm text-gray-500">Assignee: {item.assignee}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    priorityColors[item.priority]
                  }`}
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingTickets
                ? "Creating..."
                : `Create ${actionItems.filter((i) => i.selected).length} Jira Tickets`}
            </button>
            <button
              onClick={() => setActionItems([])}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      {!isProcessing && !error && actionItems.length === 0 && (
        <p className="text-sm text-gray-500">No action items yet.</p>
      )}
    </div>
  );
}
