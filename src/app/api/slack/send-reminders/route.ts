import { NextResponse } from "next/server";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// Mapping of Jira names to Slack user IDs
const SLACK_USER_IDS: Record<string, string> = {
  "Ieltxu Algañaras": "U067X2BG4L8",
  "Mauro Gilardenghi": "U02GX8F523B",
  "Agustin Daverede": "U086D1HU2HW",
  "Rodrigo Gasha": "U07UTLHQF7W",
};

interface Ticket {
  key: string;
  summary: string;
  assignee: string;
  daysStale: number;
  url: string;
}

async function sendSlackDM(userId: string, message: string) {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      channel: userId,
      text: message,
    }),
  });

  const data = await response.json();
  return data;
}

export async function POST(request: Request) {
  try {
    const { tickets } = await request.json() as { tickets: Ticket[] };

    if (!SLACK_BOT_TOKEN) {
      return NextResponse.json(
        { error: "Slack token not configured" },
        { status: 500 }
      );
    }

    // Group tickets by assignee
    const ticketsByAssignee: Record<string, Ticket[]> = {};
    for (const ticket of tickets) {
      if (!ticketsByAssignee[ticket.assignee]) {
        ticketsByAssignee[ticket.assignee] = [];
      }
      ticketsByAssignee[ticket.assignee].push(ticket);
    }

    const results = [];

    // Send message to each assignee
    for (const [assignee, assigneeTickets] of Object.entries(ticketsByAssignee)) {
      const slackUserId = SLACK_USER_IDS[assignee];

      if (!slackUserId) {
        results.push({
          assignee,
          success: false,
          error: "Slack user not found",
        });
        continue;
      }

      const ticketCount = assigneeTickets.length;
      const ticketList = assigneeTickets
        .map((t) => `• *${t.key}* - ${t.summary} (${t.daysStale} días) → ${t.url}`)
        .join("\n");

      const message = `Hey! 👋

Tienes *${ticketCount} ticket${ticketCount > 1 ? "s" : ""}* en el board sin actualizar por más de 4 días:

${ticketList}

¿Necesitas ayuda? 🙌`;

      const response = await sendSlackDM(slackUserId, message);

      results.push({
        assignee,
        success: response.ok,
        error: response.error || null,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error sending Slack reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
