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
            content: `Analyze this meeting transcript and extract action items. For each action item, identify:
1. The task to be done (be specific and actionable)
2. Who should do it (assignee) - use the person's name if mentioned, otherwise "Unassigned"
3. Priority (high, medium, or low) - use "high" only for urgent or blocking items

Return ONLY a valid JSON array with this exact format, no other text or explanation:
[
  {
    "task": "description of the task",
    "assignee": "person name or Unassigned",
    "priority": "high"
  }
]

If there are no clear action items, return an empty array: []

Here is the transcript:
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
    let parsedItems = [];
    try {
      // Find JSON array in the response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedItems = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse Claude response:", content);
      return NextResponse.json(
        { error: "Failed to parse action items" },
        { status: 500 }
      );
    }

    // Normalize and add IDs
    const items: ActionItem[] = parsedItems
      .filter(
        (item: { task?: string; assignee?: string; priority?: string }) =>
          item &&
          typeof item.task === "string" &&
          item.task.trim().length > 0
      )
      .map((item: { task: string; assignee?: string; priority?: string }, index: number) => ({
        id: String(index + 1),
        task: item.task.trim(),
        assignee: (item.assignee || "Unassigned").trim(),
        priority: (item.priority || "medium") as Priority,
        selected: true,
      }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error processing transcript:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
