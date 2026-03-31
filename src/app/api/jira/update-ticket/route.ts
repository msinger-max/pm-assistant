import { NextResponse } from "next/server";

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

  const authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;

  try {
    const { issueKey, targetStatus }: { issueKey: string; targetStatus: string } = await request.json();

    if (!issueKey || !targetStatus) {
      return NextResponse.json(
        { error: "issueKey and targetStatus are required" },
        { status: 400 }
      );
    }

    // Get available transitions for this issue
    const transitionsRes = await fetch(
      `${baseUrl}/rest/api/3/issue/${issueKey}/transitions`,
      {
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      }
    );

    if (!transitionsRes.ok) {
      return NextResponse.json(
        { error: `Failed to get transitions for ${issueKey}` },
        { status: 500 }
      );
    }

    const { transitions } = await transitionsRes.json();
    const transition = transitions.find(
      (t: { name: string }) => t.name.toLowerCase() === targetStatus.toLowerCase()
    );

    if (!transition) {
      const available = transitions.map((t: { name: string }) => t.name);
      return NextResponse.json(
        { error: `Transition "${targetStatus}" not available. Available: ${available.join(", ")}` },
        { status: 400 }
      );
    }

    // Execute the transition
    const updateRes = await fetch(
      `${baseUrl}/rest/api/3/issue/${issueKey}/transitions`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transition: { id: transition.id } }),
      }
    );

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      return NextResponse.json(
        { error: `Failed to transition ${issueKey}: ${errorText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      issueKey,
      newStatus: targetStatus,
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
