"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface WeeklyDataPoint {
  week: string;
  created: number;
  completed: number;
}

interface AnalyticsData {
  ticketsCreated: number;
  ticketsCompleted: number;
  completionRate: number;
  avgTimeOpen: number;
  avgVelocity: number;
  createdByAssignee: Record<string, number>;
  completedByAssignee: Record<string, number>;
  ticketsByLabel: Record<string, number>;
  weeklyData: WeeklyDataPoint[];
}

interface AnalyticsProps {
  project: string;
  darkMode?: boolean;
}

const DATE_RANGES = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "This month", value: "month" },
  { label: "This quarter", value: "quarter" },
];

export default function Analytics({ project, darkMode = false }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [project, dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/jira/analytics?project=${project}&range=${dateRange}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load analytics");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const getAssigneeStyle = (assignee: string) => {
    const styles: Record<string, { text: string; bar: string; darkText: string }> = {
      "Rodrigo Gasha": { text: "text-blue-700", bar: "bg-blue-500", darkText: "text-blue-300" },
      "Agustin Daverede": { text: "text-emerald-700", bar: "bg-emerald-500", darkText: "text-emerald-300" },
      "Mauro Gilardenghi": { text: "text-violet-700", bar: "bg-violet-500", darkText: "text-violet-300" },
      "Ieltxu Algañaras": { text: "text-amber-700", bar: "bg-amber-500", darkText: "text-amber-300" },
    };
    return styles[assignee] || { text: "text-slate-600", bar: "bg-slate-400", darkText: "text-slate-300" };
  };

  const getLabelColor = (index: number) => {
    const colors = [
      "bg-violet-500",
      "bg-blue-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-cyan-500",
      "bg-purple-500",
      "bg-orange-500",
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-16 rounded-2xl border shadow-sm ${
        darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
      }`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          darkMode ? "bg-red-900/30" : "bg-red-100"
        }`}>
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className={`text-lg font-semibold mb-1 ${darkMode ? "text-white" : "text-slate-800"}`}>Error loading analytics</h3>
        <p className={`mb-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{error}</p>
        <button
          onClick={loadAnalytics}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            darkMode ? "text-violet-400 bg-violet-900/30 hover:bg-violet-900/50" : "text-violet-600 bg-violet-50 hover:bg-violet-100"
          }`}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const maxCreated = Math.max(...Object.values(data.createdByAssignee), 1);
  const maxCompleted = Math.max(...Object.values(data.completedByAssignee), 1);
  const maxLabel = Math.max(...Object.values(data.ticketsByLabel), 1);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className={`text-2xl font-bold mb-1 ${darkMode ? "text-white" : "text-slate-800"}`}>Analytics</h2>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>{project} • Performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${
              darkMode
                ? "text-slate-300 bg-slate-800 border-slate-700 hover:border-slate-600 focus:border-violet-500"
                : "text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-violet-300"
            }`}
          >
            {DATE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button
            onClick={loadAnalytics}
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className={`rounded-2xl p-5 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Created</span>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{data.ticketsCreated}</p>
        </div>

        <div className={`rounded-2xl p-5 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-emerald-900/30" : "bg-emerald-100"}`}>
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Completed</span>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{data.ticketsCompleted}</p>
        </div>

        <div className={`rounded-2xl p-5 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-violet-900/30" : "bg-violet-100"}`}>
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Completion Rate</span>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{data.completionRate}%</p>
        </div>

        <div className={`rounded-2xl p-5 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-amber-900/30" : "bg-amber-100"}`}>
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Avg Time Open</span>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{data.avgTimeOpen}<span className={`text-lg font-medium ml-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>days</span></p>
        </div>

        <div className={`rounded-2xl p-5 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-rose-900/30" : "bg-rose-100"}`}>
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Avg Velocity</span>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{data.avgVelocity}<span className={`text-lg font-medium ml-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>/week</span></p>
        </div>
      </div>

      {/* Line Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Tickets Created by Week */}
        <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <h3 className={`font-semibold mb-4 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
            Tickets Created by Week
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: darkMode ? "#475569" : "#cbd5e1" }}
                />
                <YAxis
                  tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: darkMode ? "#475569" : "#cbd5e1" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                    border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    color: darkMode ? "#f1f5f9" : "#1e293b",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={{ fill: "#818cf8", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Created"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Created vs Completed */}
        <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <h3 className={`font-semibold mb-4 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
            Created vs Completed
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: darkMode ? "#475569" : "#cbd5e1" }}
                />
                <YAxis
                  tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: darkMode ? "#475569" : "#cbd5e1" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                    border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    color: darkMode ? "#f1f5f9" : "#1e293b",
                  }}
                />
                <Legend
                  wrapperStyle={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={{ fill: "#818cf8", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Created"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ fill: "#34d399", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar Charts Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Created by Assignee */}
        <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Created by Assignee
          </h3>
          <div className="space-y-4">
            {Object.entries(data.createdByAssignee).length === 0 ? (
              <p className={`text-sm text-center py-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>No data available</p>
            ) : (
              Object.entries(data.createdByAssignee)
                .sort(([, a], [, b]) => b - a)
                .map(([assignee, count]) => {
                  const style = getAssigneeStyle(assignee);
                  const percentage = (count / maxCreated) * 100;
                  return (
                    <div key={assignee}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-sm font-medium ${darkMode ? style.darkText : style.text}`}>{assignee}</span>
                        <span className={`text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{count}</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}>
                        <div
                          className={`h-full ${style.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Completed by Assignee */}
        <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed by Assignee
          </h3>
          <div className="space-y-4">
            {Object.entries(data.completedByAssignee).length === 0 ? (
              <p className={`text-sm text-center py-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>No data available</p>
            ) : (
              Object.entries(data.completedByAssignee)
                .sort(([, a], [, b]) => b - a)
                .map(([assignee, count]) => {
                  const style = getAssigneeStyle(assignee);
                  const percentage = (count / maxCompleted) * 100;
                  return (
                    <div key={assignee}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-sm font-medium ${darkMode ? style.darkText : style.text}`}>{assignee}</span>
                        <span className={`text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{count}</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}>
                        <div
                          className={`h-full ${style.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Tickets by Label */}
      <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
          <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Tickets by Label
        </h3>
        {Object.entries(data.ticketsByLabel).length === 0 ? (
          <p className={`text-sm text-center py-8 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>No labels found in tickets</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data.ticketsByLabel)
              .sort(([, a], [, b]) => b - a)
              .map(([label, count], index) => {
                const percentage = (count / maxLabel) * 100;
                const barColor = getLabelColor(index);
                return (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-sm font-medium truncate ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
                      <span className={`text-sm font-semibold ml-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{count}</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}>
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
