import { NextResponse } from "next/server";
import mammoth from "mammoth";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let inputText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData.getAll("file") as File[];
      const pastedText = formData.get("text") as string | null;

      if (files.length > 0) {
        const textParts: string[] = [];
        for (const file of files) {
          const buffer = Buffer.from(await file.arrayBuffer());
          if (file.name.endsWith(".docx")) {
            const result = await mammoth.extractRawText({ buffer });
            textParts.push(`--- ${file.name} ---\n${result.value}`);
          } else {
            textParts.push(`--- ${file.name} ---\n${buffer.toString("utf-8")}`);
          }
        }
        inputText = textParts.join("\n\n");
      } else if (pastedText) {
        inputText = pastedText;
      }
    } else {
      const body = await request.json();
      inputText = body.text || "";
    }

    if (!inputText.trim()) {
      return NextResponse.json(
        { error: "No input text provided" },
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
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are a PM assistant that generates Weekly Business Review (WBR) documents.

Analyze the following input (which may be meeting notes, transcripts, status updates, or raw notes) and produce a structured WBR document.

The WBR must follow this exact JSON structure:

{
  "title": "Weekly Review NTRVSTA/ARC Week [N] - [date range]",
  "overview": "Executive summary paragraph covering the highlights of the week across all projects",
  "projectUpdates": [
    {
      "projectName": "NTRVSTA",
      "subsections": [
        {
          "title": "Category name (e.g., Multi-Language Support & Client Demos)",
          "bullets": ["Specific update 1", "Specific update 2"]
        }
      ]
    },
    {
      "projectName": "ARC",
      "subsections": [
        {
          "title": "Category name (e.g., Testing & Validation)",
          "bullets": ["Specific update 1", "Specific update 2"]
        }
      ]
    }
  ],
  "upcomingPriorities": [
    {
      "projectName": "NTRVSTA",
      "items": ["Priority 1", "Priority 2"]
    },
    {
      "projectName": "ARC",
      "items": ["Priority 1", "Priority 2"]
    }
  ]
}

Rules:
- Group updates under the correct project (NTRVSTA or ARC/TRACKER)
- If the input does not clearly separate projects, make your best inference
- Create meaningful subsection groupings (e.g., by feature area, tech domain)
- The overview should be 2-4 sentences summarizing the week's key achievements and focus areas
- Infer the week number and date range from the input if possible, otherwise use placeholder text
- Be detailed and specific in bullet points - include technical details, names, and metrics mentioned
- Return ONLY valid JSON, no additional text

Input:
${inputText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Anthropic API error:", errorData);
      return NextResponse.json(
        { error: errorData?.error?.message || "Failed to generate WBR" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.content[0]?.text || "{}";

    let wbrData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        wbrData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse Claude response:", content);
      return NextResponse.json(
        { error: "Failed to parse WBR output" },
        { status: 500 }
      );
    }

    return NextResponse.json({ wbr: wbrData });
  } catch (error) {
    console.error("Error generating WBR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
