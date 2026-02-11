"use client";

import { useState, useEffect } from "react";

interface Ticket {
  key: string;
  summary: string;
  assignee: string;
  status: string;
  daysStale: number;
  url: string;
}

interface StaleTicketsProps {
  project: string;
}

export default function StaleTickets({ project }: StaleTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadStaleTickets();
  }, [project]);

  const loadStaleTickets = async () => {
    setIsLoading(true);
    setSelectedTickets(new Set());
    setSendResult(null);
    try {
      const response = await fetch(`/api/jira/stale-tickets?project=${project}`);
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTicket = (key: string) => {
    setSelectedTickets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedTickets.size === tickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(tickets.map((t) => t.key)));
    }
  };

  const handleSendReminders = async () => {
    const selected = tickets.filter((t) => selectedTickets.has(t.key));
    if (selected.length === 0) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/slack/send-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickets: selected }),
      });

      const data = await response.json();

      if (response.ok) {
        const successCount = data.results.filter((r: { success: boolean }) => r.success).length;
        const totalAssignees = data.results.length;
        setSendResult({
          success: true,
          message: `Sent reminders to ${successCount}/${totalAssignees} team members!`,
        });
        setSelectedTickets(new Set());
      } else {
        setSendResult({
          success: false,
          message: data.error || "Failed to send reminders",
        });
      }
    } catch (error) {
      setSendResult({
        success: false,
        message: "Error connecting to Slack",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getDaysStyle = (days: number) => {
    if (days >= 14) return { bg: "bg-red-50", text: "text-red-600", ring: "ring-red-100" };
    if (days >= 7) return { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-100" };
    return { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" };
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-50 text-blue-600";
      case "Testing":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const getAssigneeStyle = (assignee: string) => {
    const styles: Record<string, { bg: string; text: string; dot: string }> = {
      "Rodrigo Gasha": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
      "Agustin Daverede": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
      "Mauro Gilardenghi": { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
      "Ieltxu Algañaras": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
    };
    return styles[assignee] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Loading stale tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Stale Tickets</h2>
          <p className="text-slate-500">{project} • Tickets with no activity for 4+ days</p>
        </div>
        <button
          onClick={loadStaleTickets}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">All caught up!</h3>
          <p className="text-slate-500">No stale tickets. All board tickets have recent activity.</p>
        </div>
      ) : (
        <>
          {/* Action Bar */}
          <div className="mb-4 flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xs font-bold">
                  {tickets.length}
                </span>
                <span className="text-slate-600">tickets need attention</span>
              </span>
            </div>
            <button
              onClick={selectAll}
              className="text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              {selectedTickets.size === tickets.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {/* Tickets List */}
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const daysStyle = getDaysStyle(ticket.daysStale);
              const assigneeStyle = getAssigneeStyle(ticket.assignee);
              const isSelected = selectedTickets.has(ticket.key);

              return (
                <div
                  key={ticket.key}
                  onClick={() => toggleTicket(ticket.key)}
                  className={`bg-white rounded-xl p-4 transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? "border-violet-300 ring-2 ring-violet-100 shadow-md"
                      : "border-slate-100 hover:border-slate-200 shadow-sm hover:shadow"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-violet-600 border-violet-600"
                        : "border-slate-300 hover:border-violet-400"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <a
                          href={ticket.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md"
                        >
                          {ticket.key}
                        </a>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${getStatusStyle(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>

                      <p className="text-slate-700 font-medium mb-3">{ticket.summary}</p>

                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg ${assigneeStyle.bg}`}>
                          <div className={`w-2 h-2 rounded-full ${assigneeStyle.dot}`}></div>
                          <span className={`text-xs font-medium ${assigneeStyle.text}`}>
                            {ticket.assignee}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${daysStyle.bg}`}>
                          <svg className={`w-3.5 h-3.5 ${daysStyle.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`text-xs font-semibold ${daysStyle.text}`}>
                            {ticket.daysStale}d stale
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Send Reminders */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleSendReminders}
              disabled={selectedTickets.size === 0 || isSending}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-500/25 disabled:shadow-none"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Slack Reminders ({selectedTickets.size})
                </>
              )}
            </button>

            {sendResult && (
              <div
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${
                  sendResult.success
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {sendResult.success ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-medium text-sm">{sendResult.message}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
