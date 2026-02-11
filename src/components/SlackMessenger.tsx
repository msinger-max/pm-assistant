"use client";

import { useState } from "react";

interface RecentMessage {
  id: string;
  channel: string;
  message: string;
  timestamp: string;
}

interface SlackMessengerProps {
  darkMode?: boolean;
}

export default function SlackMessenger({ darkMode = false }: SlackMessengerProps) {
  const [channel, setChannel] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);

  const quickMessages = [
    { label: "Daily Standup Reminder", text: "Hey team! Don't forget we have standup in 15 minutes." },
    { label: "EOD Check-in", text: "Hi! Quick check-in: How's your progress today? Any blockers?" },
    { label: "Meeting Follow-up", text: "Thanks for the meeting today! I'll send over the action items shortly." },
  ];

  const handleSend = async () => {
    if (!channel.trim() || !message.trim()) return;

    setIsSending(true);

    // TODO: Connect to Slack API
    setTimeout(() => {
      const newMessage: RecentMessage = {
        id: Date.now().toString(),
        channel,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setRecentMessages((prev) => [newMessage, ...prev].slice(0, 5));
      setMessage("");
      setIsSending(false);
      alert(`Message sent to ${channel}!`);
    }, 500);
  };

  const handleQuickMessage = (text: string) => {
    setMessage(text);
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
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
            Channel or User
          </label>
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="e.g., #general or @username"
            className={`w-full px-4 py-2 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
              darkMode
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                : "bg-white border border-gray-300 text-gray-900"
            }`}
          />
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

        <button
          onClick={handleSend}
          disabled={isSending || !channel.trim() || !message.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
        >
          {isSending ? "Sending..." : "Send Message"}
        </button>
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
                  <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{msg.channel}</span>
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
