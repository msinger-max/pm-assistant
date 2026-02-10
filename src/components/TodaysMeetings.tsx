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

export default function TodaysMeetings() {
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
          <h2 className="text-2xl font-bold text-gray-900">Today's Meetings</h2>
          <p className="text-gray-500">
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
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Send All Reminders
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">No meetings scheduled for today!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="text-center min-w-[80px]">
                    <div className="text-lg font-semibold text-gray-900">
                      {meeting.time}
                    </div>
                    <div className="text-sm text-gray-500">{meeting.duration}</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                    <p className="text-sm text-gray-500">
                      {meeting.attendees.join(", ")}
                    </p>
                    {meeting.meetingLink && (
                      <a
                        href={meeting.meetingLink}
                        className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                      >
                        Join Meeting
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSendReminder(meeting)}
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
