"use client";

import { useState } from "react";
import TranscriptProcessor from "@/components/TranscriptProcessor";
import StaleTickets from "@/components/StaleTickets";
import SlackMessenger from "@/components/SlackMessenger";
import TodaysMeetings from "@/components/TodaysMeetings";
import BoardView from "@/components/BoardView";

type Tab = "board" | "transcript" | "tickets" | "slack" | "meetings";

const PROJECTS = [
  { key: "NTRVSTA", name: "NTRVSTA", color: "from-violet-500 to-purple-600" },
  { key: "TRACK", name: "TRACK", color: "from-emerald-500 to-teal-600" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [activeProject, setActiveProject] = useState(PROJECTS[0]);

  const tabs = [
    { id: "board" as Tab, label: "Board", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    )},
    { id: "transcript" as Tab, label: "Transcripts", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { id: "tickets" as Tab, label: "Stale Tickets", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: "slack" as Tab, label: "Slack", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )},
    { id: "meetings" as Tab, label: "Meetings", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200/60 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">PM Assistant</h1>
              <p className="text-xs text-slate-400">Productivity hub</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Project Selector */}
        <div className="p-4 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Project
          </h3>
          <div className="space-y-2">
            {PROJECTS.map((project) => (
              <button
                key={project.key}
                onClick={() => setActiveProject(project)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                  activeProject.key === project.key
                    ? "bg-slate-100 ring-2 ring-violet-500/20"
                    : "hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-9 h-9 bg-gradient-to-br ${project.color} rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                >
                  {project.key.substring(0, 2)}
                </div>
                <span className={`font-medium ${
                  activeProject.key === project.key ? "text-slate-900" : "text-slate-600"
                }`}>
                  {project.name}
                </span>
                {activeProject.key === project.key && (
                  <svg className="w-5 h-5 text-violet-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === "board" && <BoardView project={activeProject.key} />}
          {activeTab === "transcript" && <TranscriptProcessor />}
          {activeTab === "tickets" && <StaleTickets project={activeProject.key} />}
          {activeTab === "slack" && <SlackMessenger />}
          {activeTab === "meetings" && <TodaysMeetings />}
        </div>
      </main>
    </div>
  );
}
