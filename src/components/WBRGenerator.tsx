"use client";

import { useState, useRef, useEffect } from "react";

interface WBRProjectUpdate {
  projectName: string;
  subsections: {
    title: string;
    bullets: string[];
  }[];
}

interface WBRData {
  title: string;
  overview: string;
  projectUpdates: WBRProjectUpdate[];
  upcomingPriorities: {
    projectName: string;
    items: string[];
  }[];
}

interface AnalyticsMetrics {
  project: string;
  ticketsCreated: number;
  ticketsCompleted: number;
  completionRate: number;
  avgTimeOpen: number;
  avgVelocity: number;
  wipByStatus: { status: string; count: number }[];
}

interface WBRGeneratorProps {
  darkMode?: boolean;
}

export default function WBRGenerator({ darkMode = false }: WBRGeneratorProps) {
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [pastedText, setPastedText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wbrData, setWbrData] = useState<WBRData | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch analytics metrics for both projects on mount
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [ntrvstaRes, arcRes] = await Promise.all([
          fetch("/api/jira/analytics?project=NTRVSTA&range=7d"),
          fetch("/api/jira/analytics?project=ARC&range=7d"),
        ]);
        const ntrvsta = await ntrvstaRes.json();
        const arc = await arcRes.json();

        setMetrics([
          { project: "NTRVSTA", ...ntrvsta },
          { project: "ARC", ...arc },
        ]);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      }
    };
    fetchMetrics();
  }, []);

  const handleFileSelect = (files: FileList | File[]) => {
    const newFiles: File[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "docx" && ext !== "txt") {
        setError("Only .docx and .txt files are supported");
        return;
      }
      newFiles.push(file);
    }
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    setError(null);
    setWbrData(null);

    try {
      const formData = new FormData();
      if (inputMode === "file" && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          formData.append("file", file);
        }
      } else {
        formData.append("text", pastedText);
      }

      const response = await fetch("/api/wbr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate WBR");
      }

      setWbrData(data.wbr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate WBR");
    } finally {
      setIsProcessing(false);
    }
  };

  const wbrToMarkdown = (data: WBRData): string => {
    let md = `# ${data.title}\n\n`;
    md += `## Overview\n${data.overview}\n\n`;

    md += `## Detailed Updates per Project\n\n`;
    for (const project of data.projectUpdates) {
      md += `### ${project.projectName}\n\n`;
      for (const sub of project.subsections) {
        md += `#### ${sub.title}\n`;
        for (const bullet of sub.bullets) {
          md += `- ${bullet}\n`;
        }
        md += `\n`;
      }
    }

    md += `## Upcoming Priorities\n\n`;
    for (const p of data.upcomingPriorities) {
      md += `### ${p.projectName}\n`;
      for (const item of p.items) {
        md += `- ${item}\n`;
      }
      md += `\n`;
    }

    if (metrics.length > 0) {
      md += `## Metrics\n\n`;
      md += `| Project | Created | Completed | Completion Rate | Avg Time Open | Velocity |\n`;
      md += `|---------|---------|-----------|-----------------|---------------|----------|\n`;
      for (const m of metrics) {
        md += `| ${m.project} | ${m.ticketsCreated} | ${m.ticketsCompleted} | ${m.completionRate}% | ${m.avgTimeOpen}d | ${m.avgVelocity}/wk |\n`;
      }
    }

    return md;
  };

  const handleCopy = async () => {
    if (!wbrData) return;
    await navigator.clipboard.writeText(wbrToMarkdown(wbrData));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const projectColor = (name: string) =>
    name === "ARC" || name === "TRACKER"
      ? "from-emerald-500 to-teal-600"
      : "from-violet-500 to-purple-600";

  // --- Render ---

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
          Weekly Business Review
        </h2>
        <p className={darkMode ? "text-slate-400" : "text-gray-500"}>
          Upload meeting notes or transcripts to generate a structured WBR
        </p>
      </div>

      {/* Input Section */}
      {!wbrData && !isProcessing && (
        <div className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
          {/* Mode Toggle */}
          <div className={`inline-flex rounded-xl p-1 mb-4 ${darkMode ? "bg-slate-700" : "bg-gray-100"}`}>
            <button
              onClick={() => setInputMode("file")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === "file"
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm"
                  : darkMode ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setInputMode("paste")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === "paste"
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm"
                  : darkMode ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Paste Text
            </button>
          </div>

          {/* File Upload */}
          {inputMode === "file" && (
            <div>
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-violet-500 bg-violet-500/10"
                    : darkMode ? "border-slate-600 hover:border-slate-500" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.txt"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files);
                    }
                    e.target.value = "";
                  }}
                />
                <svg className={`w-10 h-10 mx-auto mb-3 ${darkMode ? "text-slate-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className={`font-medium ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
                  Drop files here or click to browse
                </p>
                <p className={`text-sm mt-1 ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
                  Supports .docx and .txt files (multiple allowed)
                </p>
              </div>

              {/* File List */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
                        darkMode ? "bg-slate-700" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg className={`w-5 h-5 flex-shrink-0 ${darkMode ? "text-emerald-400" : "text-emerald-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                          <p className={`text-xs ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className={`p-1 rounded-lg transition-colors ${
                          darkMode ? "hover:bg-slate-600 text-slate-400 hover:text-red-400" : "hover:bg-gray-200 text-gray-400 hover:text-red-500"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paste Text */}
          {inputMode === "paste" && (
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your meeting notes, transcript, or status updates here..."
              rows={10}
              className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  : "bg-white border border-gray-300 text-gray-900"
              }`}
            />
          )}

          {/* Error */}
          {error && (
            <div className={`mt-3 px-4 py-2 rounded-xl text-sm ${
              darkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
            }`}>
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isProcessing || (inputMode === "file" ? selectedFiles.length === 0 : !pastedText.trim())}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
          >
            Generate WBR
          </button>
        </div>
      )}

      {/* Loading */}
      {isProcessing && (
        <div className={`rounded-2xl p-12 border text-center ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>Generating your WBR...</p>
          <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
            Analyzing content and structuring the review
          </p>
        </div>
      )}

      {/* Result */}
      {wbrData && !isProcessing && (
        <div className="space-y-6">
          {/* Title Bar */}
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {wbrData.title}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`px-4 py-2 text-sm rounded-xl transition-all ${
                  copySuccess
                    ? darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                    : darkMode ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {copySuccess ? "Copied!" : "Copy as Markdown"}
              </button>
              <button
                onClick={() => { setWbrData(null); setSelectedFiles([]); setPastedText(""); setError(null); }}
                className={`px-4 py-2 text-sm rounded-xl ${
                  darkMode ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                New WBR
              </button>
            </div>
          </div>

          {/* Overview */}
          <div className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <h4 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
              Overview
            </h4>
            <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
              {wbrData.overview}
            </p>
          </div>

          {/* Project Updates */}
          {wbrData.projectUpdates.map((project) => (
            <div
              key={project.projectName}
              className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 bg-gradient-to-br ${projectColor(project.projectName)} rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                  {project.projectName.substring(0, 2)}
                </div>
                <h4 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {project.projectName}
                </h4>
              </div>

              <div className="space-y-5">
                {project.subsections.map((sub, idx) => (
                  <div key={idx}>
                    <h5 className={`font-medium mb-2 ${darkMode ? "text-slate-200" : "text-gray-800"}`}>
                      {sub.title}
                    </h5>
                    <ul className="space-y-1.5 ml-1">
                      {sub.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            project.projectName === "ARC" ? "bg-emerald-500" : "bg-violet-500"
                          }`} />
                          <span className={`text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Upcoming Priorities */}
          <div className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
              Upcoming Priorities
            </h4>
            <div className="grid grid-cols-2 gap-6">
              {wbrData.upcomingPriorities.map((p) => (
                <div key={p.projectName}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 bg-gradient-to-br ${projectColor(p.projectName)} rounded flex items-center justify-center text-white text-[10px] font-bold`}>
                      {p.projectName.substring(0, 2)}
                    </div>
                    <h5 className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {p.projectName}
                    </h5>
                  </div>
                  <ul className="space-y-1.5">
                    {p.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          p.projectName === "ARC" ? "bg-emerald-500" : "bg-violet-500"
                        }`} />
                        <span className={`text-sm ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics from Analytics */}
          {metrics.length > 0 && (
            <div className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
              <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                Board Metrics (This Week)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={darkMode ? "text-slate-400" : "text-gray-500"}>
                      <th className="text-left py-2 pr-4 font-medium">Project</th>
                      <th className="text-center py-2 px-4 font-medium">Created</th>
                      <th className="text-center py-2 px-4 font-medium">Completed</th>
                      <th className="text-center py-2 px-4 font-medium">Completion Rate</th>
                      <th className="text-center py-2 px-4 font-medium">Avg Time Open</th>
                      <th className="text-center py-2 px-4 font-medium">Velocity</th>
                      <th className="text-left py-2 pl-4 font-medium">WIP</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? "divide-slate-700" : "divide-gray-100"}`}>
                    {metrics.map((m) => (
                      <tr key={m.project}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 bg-gradient-to-br ${projectColor(m.project)} rounded flex items-center justify-center text-white text-[10px] font-bold`}>
                              {m.project.substring(0, 2)}
                            </div>
                            <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                              {m.project}
                            </span>
                          </div>
                        </td>
                        <td className={`text-center py-3 px-4 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                          {m.ticketsCreated}
                        </td>
                        <td className={`text-center py-3 px-4 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                          {m.ticketsCompleted}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.completionRate >= 70
                              ? darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                              : m.completionRate >= 40
                                ? darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700"
                                : darkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                          }`}>
                            {m.completionRate}%
                          </span>
                        </td>
                        <td className={`text-center py-3 px-4 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                          {m.avgTimeOpen}d
                        </td>
                        <td className={`text-center py-3 px-4 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                          {m.avgVelocity}/wk
                        </td>
                        <td className="py-3 pl-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {m.wipByStatus?.map((w) => (
                              <span
                                key={w.status}
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                                  darkMode ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {w.status}: {w.count}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
