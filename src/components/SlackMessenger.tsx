"use client";

import { useState, useEffect, useRef } from "react";

interface SlackTarget {
  id: string;
  name: string;
  type: "channel" | "user";
}

interface RecentMessage {
  id: string;
  target: string;
  message: string;
  timestamp: string;
}

interface SlackMessengerProps {
  darkMode?: boolean;
}

export default function SlackMessenger({ darkMode = false }: SlackMessengerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<SlackTarget[]>([]);
  const [suggestions, setSuggestions] = useState<SlackTarget[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const quickMessages = [
    { label: "Daily Standup Reminder", text: "Hey team! Don't forget we have standup in 15 minutes." },
    { label: "EOD Check-in", text: "Hi! Quick check-in: How's your progress today? Any blockers?" },
    { label: "Meeting Follow-up", text: "Thanks for the meeting today! I'll send over the action items shortly." },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchChannels = async () => {
      if (searchQuery.length < 1) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/slack/channels?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        // Filter out already selected targets
        const filtered = (data.results || []).filter(
          (item: SlackTarget) => !selectedTargets.some(t => t.id === item.id)
        );
        setSuggestions(filtered);
      } catch (error) {
        console.error("Error searching channels:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounce = setTimeout(searchChannels, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedTargets]);

  const handleSelectTarget = (target: SlackTarget) => {
    setSelectedTargets(prev => [...prev, target]);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRemoveTarget = (targetId: string) => {
    setSelectedTargets(prev => prev.filter(t => t.id !== targetId));
  };

  const handleSend = async () => {
    if (selectedTargets.length === 0 || !message.trim()) return;

    setIsSending(true);
    setSendResult(null);

    const results: { target: string; success: boolean; error?: string }[] = [];

    // Send to all selected targets
    for (const target of selectedTargets) {
      try {
        const response = await fetch("/api/slack/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: target.id,
            message: message.trim(),
            isUser: target.type === "user",
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          results.push({ target: target.name, success: true });
          const newMessage: RecentMessage = {
            id: `${Date.now()}-${target.id}`,
            target: target.name,
            message: message.trim(),
            timestamp: new Date().toLocaleTimeString(),
          };
          setRecentMessages((prev) => [newMessage, ...prev].slice(0, 10));
        } else {
          results.push({ target: target.name, success: false, error: data.error });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        results.push({ target: target.name, success: false, error: "Connection error" });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (failCount === 0) {
      setSendResult({
        success: true,
        message: `Message sent to ${successCount} recipient${successCount > 1 ? 's' : ''}!`
      });
      setMessage("");
      setSelectedTargets([]);
    } else if (successCount === 0) {
      setSendResult({
        success: false,
        message: `Failed to send to all ${failCount} recipient${failCount > 1 ? 's' : ''}`
      });
    } else {
      setSendResult({
        success: true,
        message: `Sent to ${successCount}, failed for ${failCount}`
      });
      setMessage("");
      setSelectedTargets([]);
    }

    setIsSending(false);
  };

  const handleQuickMessage = (text: string) => {
    setMessage(text);
  };

  const clearAllSelections = () => {
    setSelectedTargets([]);
    setSearchQuery("");
    setSuggestions([]);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Slack Messenger</h2>
        <p className={darkMode ? "text-slate-400" : "text-gray-500"}>Send quick messages to your team</p>
      </div>

      {/* Quick Messages */}
      <div className="mb-6">
        <h3 className={`text-sm font-medium mb-2 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Quick Messages</h3>
        <div className="flex flex-wrap gap-2">
          {quickMessages.map((qm, index) => (
            <button
              key={index}
              onClick={() => handleQuickMessage(qm.text)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                darkMode
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {qm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Form */}
      <div className={`rounded-2xl p-6 mb-6 border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
        <div className="mb-4" ref={searchRef}>
          <div className="flex items-center justify-between mb-1">
            <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
              Recipients
            </label>
            {selectedTargets.length > 0 && (
              <button
                onClick={clearAllSelections}
                className={`text-xs ${darkMode ? "text-slate-400 hover:text-slate-300" : "text-gray-500 hover:text-gray-700"}`}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Selected targets */}
          {selectedTargets.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTargets.map((target) => (
                <div
                  key={target.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                    target.type === "channel"
                      ? darkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700"
                      : darkMode ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  <span className="text-sm">{target.name}</span>
                  <button
                    onClick={() => handleRemoveTarget(target.id)}
                    className="p-0.5 rounded hover:bg-black/10"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={selectedTargets.length > 0 ? "Add more recipients..." : "Search for channels or users..."}
              className={`w-full px-4 py-2 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  : "bg-white border border-gray-300 text-gray-900"
              }`}
            />
            {showSuggestions && (searchQuery.length > 0 || isLoadingSuggestions) && (
              <div className={`absolute z-10 w-full mt-1 rounded-xl shadow-lg border overflow-hidden ${
                darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-gray-200"
              }`}>
                {isLoadingSuggestions ? (
                  <div className={`px-4 py-3 text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                    Searching...
                  </div>
                ) : suggestions.length > 0 ? (
                  <ul className="max-h-60 overflow-y-auto">
                    {suggestions.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleSelectTarget(item)}
                          className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                            darkMode ? "hover:bg-slate-600" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            item.type === "channel"
                              ? darkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700"
                              : darkMode ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {item.type === "channel" ? "#" : "@"}
                          </span>
                          <span className={darkMode ? "text-white" : "text-gray-900"}>{item.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={`px-4 py-3 text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className={`w-full px-4 py-2 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none ${
              darkMode
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                : "bg-white border border-gray-300 text-gray-900"
            }`}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSend}
            disabled={isSending || selectedTargets.length === 0 || !message.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sending...
              </span>
            ) : (
              `Send${selectedTargets.length > 1 ? ` to ${selectedTargets.length}` : ""}`
            )}
          </button>

          {sendResult && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                sendResult.success
                  ? darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                  : darkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"
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
              <span className="text-sm font-medium">{sendResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Messages */}
      {recentMessages.length > 0 && (
        <div>
          <h3 className={`text-sm font-medium mb-2 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
            Recently Sent
          </h3>
          <div className="space-y-2">
            {recentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  darkMode ? "bg-slate-800" : "bg-gray-50"
                }`}
              >
                <div>
                  <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{msg.target}</span>
                  <p className={`text-sm truncate max-w-md ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                    {msg.message}
                  </p>
                </div>
                <span className={`text-xs ${darkMode ? "text-slate-500" : "text-gray-400"}`}>{msg.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
