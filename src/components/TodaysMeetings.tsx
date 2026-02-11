"use client";

import { useState, useEffect } from "react";

interface Meeting {
  id: string;
  title: string;
  time: string;
  duration: string;
  attendees: string[];
  meetingLink?: string;
}

interface TodaysMeetingsProps {
  darkMode?: boolean;
}

export default function TodaysMeetings({ darkMode = false }: TodaysMeetingsProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setIsLoading(true);

    // TODO: Connect to Google Calendar API
    setTimeout(() => {
      const mockMeetings: Meeting[] = [
        {
          id: "1",
          title: "Daily Standup",
          time: "09:00 AM",
          duration: "15 min",
          attendees: ["Team"],
          meetingLink: "#",
        },
        {
          id: "2",
          title: "Sprint Planning",
          time: "10:30 AM",
          duration: "1 hour",
          attendees: ["Dev Team", "Product"],
          meetingLink: "#",
        },
        {
          id: "3",
          title: "1:1 with Manager",
          time: "02:00 PM",
          duration: "30 min",
          attendees: ["Manager"],
        },
        {
          id: "4",
          title: "Design Review",
          time: "04:00 PM",
          duration: "45 min",
          attendees: ["Design Team", "Product", "Engineering"],
          meetingLink: "#",
        },
      ];
      setMeetings(mockMeetings);
      setIsLoading(false);
    }, 800);
  };

  const handleSendReminder = (meeting: Meeting) => {
    alert(`Reminder sent for "${meeting.title}" to attendees!`);
  };

  const handleSendAllReminders = () => {
    alert(`Sending reminders for all ${meetings.length} meetings!`);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Today&apos;s Meetings</h2>
          <p className={darkMode ? "text-slate-400" : "text-gray-500"}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={handleSendAllReminders}
          disabled={meetings.length === 0}
          className="px-4 py-2.5 text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25"
        >
          Send All Reminders
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      ) : meetings.length === 0 ? (
        <div className={`text-center py-12 rounded-2xl border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
          <p className={darkMode ? "text-slate-400" : "text-gray-500"}>No meetings scheduled for today!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className={`rounded-2xl p-4 border transition-shadow hover:shadow-sm ${
                darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="text-center min-w-[80px]">
                    <div className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {meeting.time}
                    </div>
                    <div className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}>{meeting.duration}</div>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{meeting.title}</h3>
                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                      {meeting.attendees.join(", ")}
                    </p>
                    {meeting.meetingLink && (
                      <a
                        href={meeting.meetingLink}
                        className="text-sm text-violet-600 hover:text-violet-700 hover:underline mt-1 inline-block"
                      >
                        Join Meeting
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSendReminder(meeting)}
                  className={`px-3 py-1.5 text-sm rounded-xl transition-colors border ${
                    darkMode
                      ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Send Reminder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
