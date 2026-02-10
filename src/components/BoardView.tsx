"use client";

import { useState, useEffect } from "react";

interface Ticket {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  updated: string;
  url: string;
}

export default function BoardView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBoardTickets();
  }, []);

  const loadBoardTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/jira/board");
      const data = await response.json();
      setTickets(data.tickets);
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const inProgressTickets = tickets.filter((t) => t.status === "In Progress");
  const testingTickets = tickets.filter((t) => t.status === "Testing");

  const getAssigneeColor = (assignee: string) => {
    const colors: Record<string, string> = {
      "Rodrigo Gasha": "bg-blue-100 text-blue-800",
      "Agustin Daverede": "bg-green-100 text-green-800",
      "Mauro Gilardenghi": "bg-purple-100 text-purple-800",
      "Ieltxu Algañaras": "bg-orange-100 text-orange-800",
      Unassigned: "bg-gray-100 text-gray-800",
    };
    return colors[assignee] || "bg-gray-100 text-gray-800";
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => (
    <a
      href={ticket.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-blue-600">{ticket.key}</span>
        <span className="text-xs text-gray-400">{ticket.updated}</span>
      </div>
      <h4 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">
        {ticket.summary}
      </h4>
      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${getAssigneeColor(
            ticket.assignee
          )}`}
        >
          {ticket.assignee}
        </span>
      </div>
    </a>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Board View</h2>
          <p className="text-gray-500">NTRVSTA - Active tickets</p>
        </div>
        <button
          onClick={loadBoardTickets}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* In Progress Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <h3 className="font-semibold text-gray-900">In Progress</h3>
            <span className="text-sm text-gray-500">({inProgressTickets.length})</span>
          </div>
          <div className="space-y-3 bg-gray-50 rounded-lg p-3 min-h-[400px]">
            {inProgressTickets.map((ticket) => (
              <TicketCard key={ticket.key} ticket={ticket} />
            ))}
          </div>
        </div>

        {/* Testing Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <h3 className="font-semibold text-gray-900">Testing</h3>
            <span className="text-sm text-gray-500">({testingTickets.length})</span>
          </div>
          <div className="space-y-3 bg-gray-50 rounded-lg p-3 min-h-[400px]">
            {testingTickets.map((ticket) => (
              <TicketCard key={ticket.key} ticket={ticket} />
            ))}
          </div>
        </div>
      </div>

      {/* Team Summary */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Team Workload</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(
            tickets.reduce((acc, t) => {
              acc[t.assignee] = (acc[t.assignee] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([assignee, count]) => (
            <div
              key={assignee}
              className={`px-3 py-2 rounded-lg ${getAssigneeColor(assignee)}`}
            >
              <span className="font-medium">{assignee}</span>
              <span className="ml-2 opacity-75">{count} tickets</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
