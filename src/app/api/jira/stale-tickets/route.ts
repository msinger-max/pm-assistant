import { NextResponse } from "next/server";

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    assignee: {
      displayName: string;
    } | null;
    updated: string;
  };
}

export async function GET() {
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
    const response = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql: 'project = NTRVSTA AND status in ("In Progress", "Testing") AND assignee IS NOT EMPTY ORDER BY updated ASC',
          fields: ["summary", "status", "assignee", "updated"],
          maxResults: 50,
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Jira API error:", errorText);
      return NextResponse.json(
        { error: `Jira API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const today = new Date();

    const allTickets = data.issues.map((issue: JiraIssue) => {
      const updatedDate = new Date(issue.fields.updated);
      const diffTime = today.getTime() - updatedDate.getTime();
      const daysStale = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return {
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName || "Unassigned",
        updated: issue.fields.updated.split("T")[0],
        url: `${baseUrl}/browse/${issue.key}`,
        daysStale,
      };
    });

    // Filter tickets > 4 days stale and sort by most stale first
    const staleTickets = allTickets
      .filter((ticket: { daysStale: number }) => ticket.daysStale > 4)
      .sort((a: { daysStale: number }, b: { daysStale: number }) => b.daysStale - a.daysStale);

    return NextResponse.json({ tickets: staleTickets });
  } catch (error) {
    console.error("Error fetching stale tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch stale tickets" },
      { status: 500 }
    );
  }
}
