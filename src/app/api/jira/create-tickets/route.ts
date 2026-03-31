import { NextResponse } from "next/server";

interface TicketRequest {
  task: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  project: string;
}

const PRIORITY_MAP: Record<string, string> = {
  high: "Highest",
  medium: "Medium",
  low: "Low",
};

export async function POST(request: Request) {
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const baseUrl = process.env.JIRA_BASE_URL;

  if (!email || !apiToken || !baseUrl) {
    return NextResponse.json(
      { error: "Jira credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const { tickets }: { tickets: TicketRequest[] } = await request.json();

    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: "No tickets provided" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      tickets.map(async (ticket) => {
        try {
          const body: Record<string, unknown> = {
            fields: {
              project: { key: ticket.project },
              summary: ticket.task,
              issuetype: { name: "Task" },
              priority: { name: PRIORITY_MAP[ticket.priority] || "Medium" },
            },
          };

          const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Jira create error:", errorText);
            return { success: false, task: ticket.task, error: errorText };
          }

          const data = await response.json();
          return {
            success: true,
            task: ticket.task,
            key: data.key,
            url: `${baseUrl}/browse/${data.key}`,
          };
        } catch (err) {
          return { success: false, task: ticket.task, error: String(err) };
        }
      })
    );

    const created = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({ created, failed });
  } catch (error) {
    console.error("Error creating tickets:", error);
    return NextResponse.json(
      { error: "Failed to create tickets" },
      { status: 500 }
    );
  }
}
