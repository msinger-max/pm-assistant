"use client";

import { useState } from "react";

interface RecentMessage {
  id: string;
  channel: string;
  message: string;
  timestamp: string;
}

export default function SlackMessenger() {
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
        <h2 className="text-2xl font-bold text-gray-900">Slack Messenger</h2>
        <p className="text-gray-500">Send quick messages to your team</p>
      </div>

      {/* Quick Messages */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Messages</h3>
        <div className="flex flex-wrap gap-2">
          {quickMessages.map((qm, index) => (
            <button
              key={index}
              onClick={() => handleQuickMessage(qm.text)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {qm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Channel or User
          </label>
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="e.g., #general or @username"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isSending || !channel.trim() || !message.trim()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? "Sending..." : "Send Message"}
        </button>
      </div>

      {/* Recent Messages */}
      {recentMessages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Recently Sent
          </h3>
          <div className="space-y-2">
            {recentMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium text-gray-900">{msg.channel}</span>
                  <p className="text-sm text-gray-500 truncate max-w-md">
                    {msg.message}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{msg.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
