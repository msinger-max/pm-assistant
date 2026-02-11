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
  darkMode?: boolean;
}

export default function BoardView({ project, darkMode = false }: BoardViewProps) {
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
    const styles: Record<string, { bg: string; text: string; dot: string; darkBg: string; darkText: string }> = {
      "Rodrigo Gasha": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400", darkBg: "bg-blue-900/30", darkText: "text-blue-300" },
      "Agustin Daverede": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", darkBg: "bg-emerald-900/30", darkText: "text-emerald-300" },
      "Mauro Gilardenghi": { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400", darkBg: "bg-violet-900/30", darkText: "text-violet-300" },
      "Ieltxu Algañaras": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", darkBg: "bg-amber-900/30", darkText: "text-amber-300" },
    };
    return styles[assignee] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400", darkBg: "bg-slate-700", darkText: "text-slate-300" };
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    const style = getAssigneeStyle(ticket.assignee);
    return (
      <a
        href={ticket.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border group ${
          darkMode
            ? "bg-slate-800 border-slate-700 hover:border-slate-600"
            : "bg-white border-slate-100 hover:border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
            darkMode ? "text-violet-400 bg-violet-900/40" : "text-violet-600 bg-violet-50"
          }`}>
            {ticket.key}
          </span>
          <span className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{ticket.updated}</span>
        </div>
        <h4 className={`text-sm font-medium mb-3 line-clamp-2 transition-colors ${
          darkMode ? "text-slate-200 group-hover:text-white" : "text-slate-700 group-hover:text-slate-900"
        }`}>
          {ticket.summary}
        </h4>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${style.dot}`}></div>
          <span className={`text-xs font-medium ${darkMode ? style.darkText : style.text}`}>
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
    bgColor,
    darkBgColor
  }: {
    title: string;
    tickets: Ticket[];
    color: string;
    bgColor: string;
    darkBgColor: string;
  }) => (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <h3 className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{title}</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${darkMode ? darkBgColor : bgColor}`}>
          {tickets.length}
        </span>
      </div>
      <div className={`flex-1 space-y-3 rounded-2xl p-4 min-h-[400px] max-h-[600px] overflow-y-auto ${darkMode ? darkBgColor : bgColor}`}>
        {tickets.length === 0 ? (
          <div className={`flex items-center justify-center h-32 text-sm ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
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
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className={`text-2xl font-bold mb-1 ${darkMode ? "text-white" : "text-slate-800"}`}>Board View</h2>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>{project} • {tickets.length} active tickets</p>
        </div>
        <button
          onClick={loadBoardTickets}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm border ${
            darkMode
              ? "text-slate-300 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
              : "text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          }`}
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
          darkBgColor="bg-slate-800/50"
        />
        <Column
          title="In Progress"
          tickets={inProgressTickets}
          color="bg-blue-500"
          bgColor="bg-blue-50/50"
          darkBgColor="bg-blue-900/20"
        />
        <Column
          title="Testing"
          tickets={testingTickets}
          color="bg-amber-500"
          bgColor="bg-amber-50/50"
          darkBgColor="bg-amber-900/20"
        />
      </div>

      {/* Team Summary */}
      <div className={`mt-8 rounded-2xl p-6 shadow-sm border ${
        darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
      }`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
          <svg className={`w-5 h-5 ${darkMode ? "text-slate-500" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${darkMode ? style.darkBg : style.bg}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`}></div>
                <span className={`font-medium text-sm ${darkMode ? style.darkText : style.text}`}>{assignee}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  darkMode ? `bg-slate-800/60 ${style.darkText}` : `bg-white/60 ${style.text}`
                }`}>
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
