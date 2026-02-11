import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const project = searchParams.get("project") || "NTRVSTA";

  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const baseUrl = process.env.JIRA_BASE_URL;

  if (!email || !apiToken || !baseUrl) {
    console.error("Missing Jira config:", { email: !!email, apiToken: !!apiToken, baseUrl: !!baseUrl });
    return NextResponse.json(
      { error: "Jira credentials not configured", debug: { email: !!email, apiToken: !!apiToken, baseUrl: !!baseUrl } },
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
          jql: `project = ${project} AND status in ("In Progress", "Testing") AND assignee IS NOT EMPTY ORDER BY updated DESC`,
          fields: ["summary", "status", "assignee", "updated"],
          maxResults: 50,
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Jira API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Jira API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.issues || !Array.isArray(data.issues)) {
      console.error("Unexpected Jira response:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json({
        tickets: [],
        error: "Unexpected response format",
        debug: JSON.stringify(data).slice(0, 200)
      });
    }

    const tickets = data.issues.map((issue: JiraIssue) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      assignee: issue.fields.assignee?.displayName || "Unassigned",
      updated: issue.fields.updated.split("T")[0],
      url: `${baseUrl}/browse/${issue.key}`,
    }));

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching Jira tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch Jira tickets", details: String(error) },
      { status: 500 }
    );
  }
}
