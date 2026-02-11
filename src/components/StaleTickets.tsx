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

  useEffect(() => {
    loadStaleTickets();
  }, [project]);

  const loadStaleTickets = async () => {
    setIsLoading(true);
    setSelectedTickets(new Set());
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

  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const getDaysColor = (days: number) => {
    if (days >= 14) return "text-red-600 bg-red-50";
    if (days >= 7) return "text-orange-600 bg-orange-50";
    return "text-yellow-600 bg-yellow-50";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-700";
      case "Testing":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getAssigneeColor = (assignee: string) => {
    const colors: Record<string, string> = {
      "Rodrigo Gasha": "bg-blue-50 text-blue-700",
      "Agustin Daverede": "bg-green-50 text-green-700",
      "Mauro Gilardenghi": "bg-purple-50 text-purple-700",
      "Ieltxu Algañaras": "bg-orange-50 text-orange-700",
    };
    return colors[assignee] || "bg-gray-50 text-gray-700";
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stale Tickets</h2>
          <p className="text-gray-500">
            {project} - Board tickets with no activity for 4+ days
          </p>
        </div>
        <button
          onClick={loadStaleTickets}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-gray-600 font-medium">No stale tickets!</p>
          <p className="text-gray-500 text-sm">All board tickets have recent activity.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-red-600">{tickets.length}</span> tickets need attention
            </p>
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:underline"
            >
              {selectedTickets.size === tickets.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.key}
                className={`bg-white border rounded-lg p-4 transition-all ${
                  selectedTickets.has(ticket.key)
                    ? "border-blue-300 ring-1 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedTickets.has(ticket.key)}
                    onChange={() => toggleTicket(ticket.key)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={ticket.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {ticket.key}
                      </a>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-gray-900 font-medium mb-2">{ticket.summary}</p>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getAssigneeColor(ticket.assignee)}`}>
                        {ticket.assignee}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getDaysColor(ticket.daysStale)}`}>
                        {ticket.daysStale} days without update
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleSendReminders}
                disabled={selectedTickets.size === 0 || isSending}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? "Sending..." : `Send Slack Reminders (${selectedTickets.size})`}
              </button>
            </div>

            {sendResult && (
              <div
                className={`p-3 rounded-lg ${
                  sendResult.success
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {sendResult.success ? "✅" : "❌"} {sendResult.message}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
