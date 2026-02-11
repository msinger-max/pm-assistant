"use client";

import { useState } from "react";
import TranscriptProcessor from "@/components/TranscriptProcessor";
import StaleTickets from "@/components/StaleTickets";
import SlackMessenger from "@/components/SlackMessenger";
import TodaysMeetings from "@/components/TodaysMeetings";
import BoardView from "@/components/BoardView";

type Tab = "board" | "transcript" | "tickets" | "slack" | "meetings";

const PROJECTS = [
  { key: "NTRVSTA", name: "NTRVSTA", color: "bg-blue-600" },
  { key: "TRACK", name: "TRACK", color: "bg-green-600" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [activeProject, setActiveProject] = useState(PROJECTS[0]);

  const tabs = [
    { id: "board" as Tab, label: "Board", icon: "📋" },
    { id: "transcript" as Tab, label: "Transcripts", icon: "📝" },
    { id: "tickets" as Tab, label: "Stale Tickets", icon: "🎫" },
    { id: "slack" as Tab, label: "Slack", icon: "💬" },
    { id: "meetings" as Tab, label: "Meetings", icon: "📅" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">PM Assistant</h1>
          <p className="text-sm text-gray-500">Your daily productivity hub</p>
        </div>

        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Project Selector */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Project
          </h3>
          <div className="space-y-2">
            {PROJECTS.map((project) => (
              <button
                key={project.key}
                onClick={() => setActiveProject(project)}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeProject.key === project.key
                    ? "bg-blue-50 ring-2 ring-blue-200"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-8 h-8 ${project.color} rounded flex items-center justify-center text-white text-xs font-bold`}
                >
                  {project.key.substring(0, 2)}
                </div>
                <span className={`font-medium ${
                  activeProject.key === project.key ? "text-blue-700" : "text-gray-900"
                }`}>
                  {project.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
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
