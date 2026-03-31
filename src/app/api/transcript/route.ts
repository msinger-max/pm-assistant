import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

type Priority = "high" | "medium" | "low";

type ActionItem = {
  id: string;
  task: string;
  assignee: string;
  priority: Priority;
  selected: boolean;
};

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Analyze this meeting transcript and extract two things:

1. **New action items** - tasks that need to be created
2. **Ticket updates** - references to existing Jira tickets that need status changes (look for patterns like "NTRVSTA-123", "ARC-45", or mentions of moving tickets to done/in progress/testing)

Return ONLY valid JSON with this exact format, no other text:
{
  "actionItems": [
    {
      "task": "description of the task",
      "assignee": "person name or Unassigned",
      "priority": "high"
    }
  ],
  "ticketUpdates": [
    {
      "issueKey": "NTRVSTA-123",
      "targetStatus": "Done",
      "reason": "brief reason from transcript"
    }
  ]
}

Rules:
- For action items: be specific and actionable. Use "high" priority only for urgent/blocking items.
- For ticket updates: only include if a specific ticket key is mentioned AND a status change is discussed.
- Valid statuses: "To Do", "In Progress", "Testing", "Done"
- If no action items found, use empty array. Same for ticket updates.

Transcript:
${transcript}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Anthropic API error:", errorData);
      return NextResponse.json(
        { error: errorData?.error?.message || "Failed to process transcript" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.content[0]?.text || "[]";

    // Parse the JSON from Claude's response
    let parsed: { actionItems?: unknown[]; ticketUpdates?: unknown[] } = { actionItems: [], ticketUpdates: [] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      // Fallback: try parsing as array (old format)
      try {
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          parsed = { actionItems: JSON.parse(arrayMatch[0]), ticketUpdates: [] };
        }
      } catch {
        console.error("Failed to parse Claude response:", content);
        return NextResponse.json(
          { error: "Failed to parse action items" },
          { status: 500 }
        );
      }
    }

    // Normalize action items
    const items: ActionItem[] = (parsed.actionItems || [])
      .filter(
        (item: unknown) => {
          const i = item as { task?: string };
          return i && typeof i.task === "string" && i.task.trim().length > 0;
        }
      )
      .map((item: unknown, index: number) => {
        const i = item as { task: string; assignee?: string; priority?: string };
        return {
          id: String(index + 1),
          task: i.task.trim(),
          assignee: (i.assignee || "Unassigned").trim(),
          priority: (i.priority || "medium") as Priority,
          selected: true,
        };
      });

    // Normalize ticket updates
    const ticketUpdates = (parsed.ticketUpdates || [])
      .filter((u: unknown) => {
        const update = u as { issueKey?: string; targetStatus?: string };
        return update && typeof update.issueKey === "string" && typeof update.targetStatus === "string";
      })
      .map((u: unknown) => {
        const update = u as { issueKey: string; targetStatus: string; reason?: string };
        return {
          issueKey: update.issueKey,
          targetStatus: update.targetStatus,
          reason: update.reason || "",
          selected: true,
        };
      });

    return NextResponse.json({ items, ticketUpdates });
  } catch (error) {
    console.error("Error processing transcript:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
