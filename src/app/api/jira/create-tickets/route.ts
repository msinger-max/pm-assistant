import { NextResponse } from "next/server";

interface TicketRequest {
  task: string;
  description: string;
  assignee: string;
  label: string;
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

    const authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;

    // Lookup assignee account IDs
    const assigneeCache: Record<string, string | null> = {};
    const lookupAssignee = async (name: string): Promise<string | null> => {
      if (name === "Unassigned" || !name) return null;
      if (assigneeCache[name] !== undefined) return assigneeCache[name];

      try {
        const res = await fetch(
          `${baseUrl}/rest/api/3/user/search?query=${encodeURIComponent(name)}&maxResults=1`,
          { headers: { Authorization: authHeader, Accept: "application/json" } }
        );
        if (res.ok) {
          const users = await res.json();
          assigneeCache[name] = users[0]?.accountId || null;
        } else {
          assigneeCache[name] = null;
        }
      } catch {
        assigneeCache[name] = null;
      }
      return assigneeCache[name];
    };

    const results = await Promise.all(
      tickets.map(async (ticket) => {
        try {
          const assigneeId = await lookupAssignee(ticket.assignee);

          const fields: Record<string, unknown> = {
            project: { key: ticket.project },
            summary: ticket.task,
            issuetype: { name: "Task" },
            priority: { name: PRIORITY_MAP[ticket.priority] || "Medium" },
          };

          if (ticket.description) {
            fields.description = {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: ticket.description }],
                },
              ],
            };
          }

          if (ticket.label) {
            fields.labels = [ticket.label.toLowerCase()];
          }

          if (assigneeId) {
            fields.assignee = { accountId: assigneeId };
          }

          const body = { fields };

          const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
            method: "POST",
            headers: {
              Authorization: authHeader,
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
