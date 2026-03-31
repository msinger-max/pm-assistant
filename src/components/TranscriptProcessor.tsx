"use client";

import { useState } from "react";

interface ActionItem {
  id: string;
  task: string;
  description: string;
  assignee: string;
  label: string;
  priority: "high" | "medium" | "low";
  selected: boolean;
}

interface TicketUpdate {
  issueKey: string;
  targetStatus: string;
  reason: string;
  selected: boolean;
}

interface CreatedTicket {
  key: string;
  task: string;
  url: string;
}

interface UpdatedTicket {
  issueKey: string;
  newStatus: string;
}

interface TranscriptProcessorProps {
  darkMode?: boolean;
}

const PROJECTS = [
  { key: "NTRVSTA", name: "NTRVSTA" },
  { key: "ARC", name: "ARC" },
];

const TEAM_MEMBERS = [
  "Unassigned",
  "Agustin Daverede",
  "Ieltxu Algañaras",
  "Matias Singer",
  "Mauro Gilardenghi",
  "Rodrigo Gasha",
];

const LABELS = ["Bug", "Feature", "Enhancement", "Task"];
const PRIORITIES: ("high" | "medium" | "low")[] = ["high", "medium", "low"];

export default function TranscriptProcessor({ darkMode = false }: TranscriptProcessorProps) {
  const [transcript, setTranscript] = useState("");
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].key);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [ticketUpdates, setTicketUpdates] = useState<TicketUpdate[]>([]);
  const [isCreatingTickets, setIsCreatingTickets] = useState(false);
  const [isUpdatingTickets, setIsUpdatingTickets] = useState(false);
  const [createdTickets, setCreatedTickets] = useState<CreatedTicket[]>([]);
  const [updatedTickets, setUpdatedTickets] = useState<UpdatedTicket[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    setError(null);
    setActionItems([]);
    setTicketUpdates([]);
    setCreatedTickets([]);
    setUpdatedTickets([]);
    setExpandedItem(null);

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
      setTicketUpdates(data.ticketUpdates ?? []);
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

  const updateItem = (id: string, field: keyof ActionItem, value: string) => {
    setActionItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const toggleUpdate = (issueKey: string) => {
    setTicketUpdates((updates) =>
      updates.map((u) =>
        u.issueKey === issueKey ? { ...u, selected: !u.selected } : u
      )
    );
  };

  const handleCreateTickets = async () => {
    const selectedItems = actionItems.filter((item) => item.selected);
    if (selectedItems.length === 0) return;

    setIsCreatingTickets(true);
    setError(null);

    try {
      const response = await fetch("/api/jira/create-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickets: selectedItems.map((item) => ({
            task: item.task,
            description: item.description,
            assignee: item.assignee,
            label: item.label,
            priority: item.priority,
            project: selectedProject,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create tickets");
      }

      setCreatedTickets(data.created || []);
      if (data.failed?.length > 0) {
        setError(`${data.failed.length} ticket(s) failed to create`);
      }
      setActionItems((items) => items.filter((i) => !i.selected));
      setExpandedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tickets");
    } finally {
      setIsCreatingTickets(false);
    }
  };

  const handleUpdateTickets = async () => {
    const selectedUpdates = ticketUpdates.filter((u) => u.selected);
    if (selectedUpdates.length === 0) return;

    setIsUpdatingTickets(true);
    setError(null);

    const results: UpdatedTicket[] = [];
    const errors: string[] = [];

    for (const update of selectedUpdates) {
      try {
        const response = await fetch("/api/jira/update-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueKey: update.issueKey,
            targetStatus: update.targetStatus,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          results.push({ issueKey: update.issueKey, newStatus: update.targetStatus });
        } else {
          errors.push(`${update.issueKey}: ${data.error}`);
        }
      } catch {
        errors.push(`${update.issueKey}: Network error`);
      }
    }

    setUpdatedTickets(results);
    if (errors.length > 0) {
      setError(errors.join("\n"));
    }
    const updatedKeys = new Set(results.map((r) => r.issueKey));
    setTicketUpdates((updates) => updates.filter((u) => !updatedKeys.has(u.issueKey)));
    setIsUpdatingTickets(false);
  };

  const handleClear = () => {
    setActionItems([]);
    setTicketUpdates([]);
    setCreatedTickets([]);
    setUpdatedTickets([]);
    setExpandedItem(null);
    setError(null);
  };

  const priorityColors = {
    high: darkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700",
    medium: darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700",
    low: darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700",
  };

  const labelColors: Record<string, string> = {
    Bug: darkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700",
    Feature: darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700",
    Enhancement: darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-700",
    Task: darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700",
  };

  const statusColors: Record<string, string> = {
    "To Do": darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700",
    "In Progress": darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700",
    "Testing": darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-700",
    "Done": darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700",
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm transition-all ${
    darkMode
      ? "bg-slate-700 border-slate-600 text-white"
      : "bg-white border-gray-300 text-gray-900"
  }`;

  const selectClass = `px-3 py-2 rounded-lg border text-sm transition-all ${
    darkMode
      ? "bg-slate-700 border-slate-600 text-white"
      : "bg-white border-gray-300 text-gray-900"
  }`;

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Process Transcript</h2>
        <p className={darkMode ? "text-slate-400" : "text-gray-500"}>
          Paste your meeting transcript to extract action items and ticket updates
        </p>
      </div>

      {/* Project Selector + Transcript Input */}
      <div className="mb-6">
        <div className="flex gap-3 mb-3">
          <div>
            <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Project for new tickets
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className={`px-4 py-2.5 rounded-xl border transition-all ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              {PROJECTS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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
        {error && (
          <p className="mt-3 text-sm text-red-500 whitespace-pre-line">{error}</p>
        )}
      </div>

      {/* New Action Items */}
      {actionItems.length > 0 && (
        <div className={`rounded-2xl p-6 border mb-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            New Action Items ({actionItems.length})
          </h3>

          <div className="space-y-3 mb-6">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border transition-all ${
                  item.selected
                    ? darkMode
                      ? "border-violet-500/50 bg-violet-900/20"
                      : "border-blue-200 bg-blue-50"
                    : darkMode
                      ? "border-slate-700 bg-slate-800/50"
                      : "border-gray-200"
                }`}
              >
                {/* Header row - always visible */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                >
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleItem(item.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {item.task}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                        {item.assignee}
                      </span>
                      <span className={`text-xs ${darkMode ? "text-slate-600" : "text-gray-300"}`}>|</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${labelColors[item.label] || labelColors.Task}`}>
                        {item.label}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium shrink-0 ${priorityColors[item.priority]}`}
                  >
                    {item.priority}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform shrink-0 ${expandedItem === item.id ? "rotate-180" : ""} ${darkMode ? "text-slate-400" : "text-gray-400"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded edit form */}
                {expandedItem === item.id && (
                  <div className={`px-4 pb-4 pt-2 border-t ${darkMode ? "border-slate-700" : "border-gray-200"}`}>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Title */}
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                          Title
                        </label>
                        <input
                          type="text"
                          value={item.task}
                          onChange={(e) => updateItem(item.id, "task", e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                          Description
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          rows={3}
                          className={`${inputClass} resize-none`}
                        />
                      </div>

                      {/* Assignee, Label, Priority row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                            Assignee
                          </label>
                          <select
                            value={item.assignee}
                            onChange={(e) => updateItem(item.id, "assignee", e.target.value)}
                            className={selectClass}
                          >
                            {TEAM_MEMBERS.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                            Label
                          </label>
                          <select
                            value={item.label}
                            onChange={(e) => updateItem(item.id, "label", e.target.value)}
                            className={selectClass}
                          >
                            {LABELS.map((l) => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                            Priority
                          </label>
                          <select
                            value={item.priority}
                            onChange={(e) => updateItem(item.id, "priority", e.target.value)}
                            className={selectClass}
                          >
                            {PRIORITIES.map((p) => (
                              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                : `Create ${actionItems.filter((i) => i.selected).length} Ticket${actionItems.filter((i) => i.selected).length !== 1 ? "s" : ""} in ${selectedProject}`}
            </button>
            <button
              onClick={handleClear}
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

      {/* Ticket Updates */}
      {ticketUpdates.length > 0 && (
        <div className={`rounded-2xl p-6 border mb-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Ticket Status Updates
          </h3>

          <div className="space-y-3 mb-6">
            {ticketUpdates.map((update) => (
              <div
                key={update.issueKey}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  update.selected
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
                  checked={update.selected}
                  onChange={() => toggleUpdate(update.issueKey)}
                  className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <div className="flex-1">
                  <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {update.issueKey}
                  </p>
                  {update.reason && (
                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}>{update.reason}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[update.targetStatus] || (darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700")}`}>
                  → {update.targetStatus}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpdateTickets}
            disabled={isUpdatingTickets || !ticketUpdates.some((u) => u.selected)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
          >
            {isUpdatingTickets
              ? "Updating..."
              : `Update ${ticketUpdates.filter((u) => u.selected).length} Ticket${ticketUpdates.filter((u) => u.selected).length !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Success Messages */}
      {createdTickets.length > 0 && (
        <div className={`rounded-2xl p-6 border mb-6 ${darkMode ? "bg-emerald-900/20 border-emerald-800" : "bg-green-50 border-green-200"}`}>
          <h3 className={`text-lg font-semibold mb-3 ${darkMode ? "text-emerald-400" : "text-green-800"}`}>
            Tickets Created
          </h3>
          <div className="space-y-2">
            {createdTickets.map((t) => (
              <div key={t.key} className="flex items-center gap-3">
                <span className={`font-mono text-sm font-medium ${darkMode ? "text-emerald-300" : "text-green-700"}`}>
                  {t.key}
                </span>
                <span className={darkMode ? "text-slate-300" : "text-gray-700"}>{t.task}</span>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-500 hover:text-violet-600 text-sm ml-auto"
                >
                  Open →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {updatedTickets.length > 0 && (
        <div className={`rounded-2xl p-6 border mb-6 ${darkMode ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"}`}>
          <h3 className={`text-lg font-semibold mb-3 ${darkMode ? "text-blue-400" : "text-blue-800"}`}>
            Tickets Updated
          </h3>
          <div className="space-y-2">
            {updatedTickets.map((t) => (
              <div key={t.issueKey} className="flex items-center gap-3">
                <span className={`font-mono text-sm font-medium ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                  {t.issueKey}
                </span>
                <span className={darkMode ? "text-slate-300" : "text-gray-700"}>→ {t.newStatus}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isProcessing && !error && actionItems.length === 0 && ticketUpdates.length === 0 && createdTickets.length === 0 && updatedTickets.length === 0 && (
        <p className={`text-sm ${darkMode ? "text-slate-500" : "text-gray-500"}`}>No action items yet.</p>
      )}
    </div>
  );
}
