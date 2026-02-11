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
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

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
        <div className="mt-8 relative">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Project
          </h3>
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-3 transition-colors"
          >
            <div
              className={`w-8 h-8 ${activeProject.color} rounded flex items-center justify-center text-white text-xs font-bold`}
            >
              {activeProject.key.substring(0, 2)}
            </div>
            <span className="font-medium text-gray-900 flex-1 text-left">
              {activeProject.name}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                projectDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {projectDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {PROJECTS.map((project) => (
                <button
                  key={project.key}
                  onClick={() => {
                    setActiveProject(project);
                    setProjectDropdownOpen(false);
                  }}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    activeProject.key === project.key ? "bg-blue-50" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 ${project.color} rounded flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {project.key.substring(0, 2)}
                  </div>
                  <span className="font-medium text-gray-900">{project.name}</span>
                  {activeProject.key === project.key && (
                    <svg
                      className="w-4 h-4 text-blue-600 ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
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
