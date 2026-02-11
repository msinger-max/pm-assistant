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

interface BoardViewProps {
  project: string;
}

export default function BoardView({ project }: BoardViewProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBoardTickets();
  }, [project]);

  const loadBoardTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/jira/board?project=${project}`);
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const todoTickets = tickets.filter((t) => t.status === "To Do");
  const inProgressTickets = tickets.filter((t) => t.status === "In Progress");
  const testingTickets = tickets.filter((t) => t.status === "Testing");

  const getAssigneeStyle = (assignee: string) => {
    const styles: Record<string, { bg: string; text: string; dot: string }> = {
      "Rodrigo Gasha": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
      "Agustin Daverede": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
      "Mauro Gilardenghi": { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
      "Ieltxu Algañaras": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
    };
    return styles[assignee] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    const style = getAssigneeStyle(ticket.assignee);
    return (
      <a
        href={ticket.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100 hover:border-slate-200 group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
            {ticket.key}
          </span>
          <span className="text-xs text-slate-400">{ticket.updated}</span>
        </div>
        <h4 className="text-sm font-medium text-slate-700 mb-3 line-clamp-2 group-hover:text-slate-900 transition-colors">
          {ticket.summary}
        </h4>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${style.dot}`}></div>
          <span className={`text-xs font-medium ${style.text}`}>
            {ticket.assignee}
          </span>
        </div>
      </a>
    );
  };

  const Column = ({
    title,
    tickets,
    color,
    bgColor
  }: {
    title: string;
    tickets: Ticket[];
    color: string;
    bgColor: string;
  }) => (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${bgColor}`}>
          {tickets.length}
        </span>
      </div>
      <div className={`flex-1 space-y-3 rounded-2xl p-4 min-h-[400px] max-h-[600px] overflow-y-auto ${bgColor}`}>
        {tickets.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
            No tickets
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard key={ticket.key} ticket={ticket} />
          ))
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Board View</h2>
          <p className="text-slate-500">{project} • {tickets.length} active tickets</p>
        </div>
        <button
          onClick={loadBoardTickets}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Board Columns */}
      <div className="grid grid-cols-3 gap-6">
        <Column
          title="To Do"
          tickets={todoTickets}
          color="bg-slate-400"
          bgColor="bg-slate-100/50"
        />
        <Column
          title="In Progress"
          tickets={inProgressTickets}
          color="bg-blue-500"
          bgColor="bg-blue-50/50"
        />
        <Column
          title="Testing"
          tickets={testingTickets}
          color="bg-amber-500"
          bgColor="bg-amber-50/50"
        />
      </div>

      {/* Team Summary */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Team Workload
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(
            tickets.reduce((acc, t) => {
              acc[t.assignee] = (acc[t.assignee] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([assignee, count]) => {
            const style = getAssigneeStyle(assignee);
            return (
              <div
                key={assignee}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${style.bg}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`}></div>
                <span className={`font-medium text-sm ${style.text}`}>{assignee}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md bg-white/60 ${style.text}`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
