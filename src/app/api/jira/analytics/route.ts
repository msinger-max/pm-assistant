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
    creator: {
      displayName: string;
    } | null;
    created: string;
    updated: string;
    resolutiondate: string | null;
    labels: string[];
  };
}

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  let startDate: Date;

  switch (range) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "14d":
      startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterMonth, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const project = searchParams.get("project") || "NTRVSTA";
  const range = searchParams.get("range") || "30d";

  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const baseUrl = process.env.JIRA_BASE_URL;

  if (!email || !apiToken || !baseUrl) {
    return NextResponse.json(
      { error: "Jira credentials not configured" },
      { status: 500 }
    );
  }

  const { startDate, endDate } = getDateRange(range);

  // Calculate endDate + 1 day for JQL queries (Jira's <= compares to start of day)
  const endDatePlusOne = new Date(endDate);
  endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
  const endDateForQuery = endDatePlusOne.toISOString().split("T")[0];

  try {
    // Fetch created tickets in date range
    const createdResponse = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: `project = ${project} AND created >= "${startDate}" AND created < "${endDateForQuery}" ORDER BY created DESC`,
        fields: ["summary", "status", "assignee", "creator", "created", "labels"],
        maxResults: 200,
      }),
      cache: "no-store",
    });

    if (!createdResponse.ok) {
      const errorText = await createdResponse.text();
      console.error("Jira API error (created):", errorText);
      return NextResponse.json(
        { error: `Jira API error: ${createdResponse.status}` },
        { status: createdResponse.status }
      );
    }

    const createdData = await createdResponse.json();
    const createdIssues: JiraIssue[] = createdData.issues || [];

    // Fetch completed tickets in date range (using updated date to track when moved to Done)
    const completedResponse = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: `project = ${project} AND status = Done AND updated >= "${startDate}" AND updated < "${endDateForQuery}" ORDER BY updated DESC`,
        fields: ["summary", "status", "assignee", "creator", "created", "updated", "resolutiondate", "labels"],
        maxResults: 200,
      }),
      cache: "no-store",
    });

    if (!completedResponse.ok) {
      const errorText = await completedResponse.text();
      console.error("Jira API error (completed):", errorText);
      return NextResponse.json(
        { error: `Jira API error: ${completedResponse.status}` },
        { status: completedResponse.status }
      );
    }

    const completedData = await completedResponse.json();
    const completedIssues: JiraIssue[] = completedData.issues || [];

    // Fetch work in progress tickets (not Done, not Backlog)
    const wipResponse = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: `project = ${project} AND status NOT IN (Done, Backlog, "To Do", Cancelled, Canceled) ORDER BY status ASC`,
        fields: ["summary", "status"],
        maxResults: 200,
      }),
      cache: "no-store",
    });

    let wipByStatus: Array<{ status: string; count: number }> = [];
    if (wipResponse.ok) {
      const wipData = await wipResponse.json();
      const wipIssues: JiraIssue[] = wipData.issues || [];

      // Group by status
      const statusCounts: Record<string, number> = {};
      wipIssues.forEach((issue) => {
        const status = issue.fields.status?.name || "Unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Convert to array and sort by count
      wipByStatus = Object.entries(statusCounts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);
    }

    // Calculate metrics
    const ticketsCreated = createdIssues.length;
    const ticketsCompleted = completedIssues.length;
    const completionRate = ticketsCreated > 0
      ? Math.round((ticketsCompleted / ticketsCreated) * 100)
      : 0;

    // Calculate average time open for completed tickets (using updated as completion date)
    let totalDaysOpen = 0;
    completedIssues.forEach((issue) => {
      if (issue.fields.updated && issue.fields.created) {
        const created = new Date(issue.fields.created);
        const completed = new Date(issue.fields.updated);
        const daysOpen = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        totalDaysOpen += daysOpen;
      }
    });
    const avgTimeOpen = ticketsCompleted > 0
      ? Math.round(totalDaysOpen / ticketsCompleted)
      : 0;

    // Calculate average velocity (tickets completed per week)
    const daysDiff = Math.max(1, (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.max(1, daysDiff / 7);
    const avgVelocity = Math.round((ticketsCompleted / weeks) * 10) / 10;

    // Created tickets by assignee (who has them assigned)
    const createdByAssignee: Record<string, number> = {};
    createdIssues.forEach((issue) => {
      const assignee = issue.fields.assignee?.displayName || "Unassigned";
      createdByAssignee[assignee] = (createdByAssignee[assignee] || 0) + 1;
    });

    // Completed by assignee
    const completedByAssignee: Record<string, number> = {};
    completedIssues.forEach((issue) => {
      const assignee = issue.fields.assignee?.displayName || "Unassigned";
      completedByAssignee[assignee] = (completedByAssignee[assignee] || 0) + 1;
    });

    // Tickets by label (from created tickets) - normalize case with capitalized display
    const ticketsByLabel: Record<string, number> = {};
    createdIssues.forEach((issue) => {
      const labels = issue.fields.labels || [];
      labels.forEach((label) => {
        // Capitalize first letter for display
        const displayLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
        ticketsByLabel[displayLabel] = (ticketsByLabel[displayLabel] || 0) + 1;
      });
    });

    // Generate weekly data for charts
    // Use date strings (YYYY-MM-DD) to avoid timezone issues
    const weeklyData: Array<{ week: string; created: number; completed: number }> = [];

    // Helper to extract date string from Jira timestamp (e.g., "2025-02-17T10:30:00.000-0800" -> "2025-02-17")
    const getDateString = (isoString: string): string => {
      return isoString.split("T")[0];
    };

    // Helper to get Monday of a week for a given date string
    const getMondayOfWeek = (dateStr: string): string => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day); // Use local date
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
      date.setDate(date.getDate() + diff);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };

    // Helper to add days to a date string
    const addDays = (dateStr: string, days: number): string => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      date.setDate(date.getDate() + days);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };

    // Helper to format date for display
    const formatWeekLabel = (dateStr: string): string => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Get Monday of start week and end date
    const startMondayStr = getMondayOfWeek(startDate);
    let currentMondayStr = startMondayStr;

    while (currentMondayStr <= endDate) {
      const weekEndStr = addDays(currentMondayStr, 6); // Sunday of this week

      // Format week label (e.g., "Jan 6")
      const weekLabel = formatWeekLabel(currentMondayStr);

      // Count created tickets in this week (compare date strings)
      const createdInWeek = createdIssues.filter((issue) => {
        const createdDate = getDateString(issue.fields.created);
        return createdDate >= currentMondayStr && createdDate <= weekEndStr;
      }).length;

      // Count completed tickets in this week (using updated date)
      const completedInWeek = completedIssues.filter((issue) => {
        if (!issue.fields.updated) return false;
        const completedDate = getDateString(issue.fields.updated);
        return completedDate >= currentMondayStr && completedDate <= weekEndStr;
      }).length;

      weeklyData.push({
        week: weekLabel,
        created: createdInWeek,
        completed: completedInWeek,
      });

      // Move to next week
      currentMondayStr = addDays(currentMondayStr, 7);
    }

    return NextResponse.json({
      ticketsCreated,
      ticketsCompleted,
      completionRate,
      avgTimeOpen,
      avgVelocity,
      createdByAssignee,
      completedByAssignee,
      ticketsByLabel,
      weeklyData,
      wipByStatus,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
