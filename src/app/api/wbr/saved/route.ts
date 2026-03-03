import { NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";

// GET - List all saved WBRs
export async function GET() {
  try {
    const { blobs } = await list({ prefix: "wbr/" });

    const saved = await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url);
        const data = await res.json();
        return {
          id: blob.pathname.replace("wbr/", "").replace(".json", ""),
          url: blob.url,
          ...data,
        };
      })
    );

    // Sort by approvedAt descending (newest first)
    saved.sort(
      (a, b) =>
        new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime()
    );

    return NextResponse.json({ saved });
  } catch (error) {
    console.error("Error listing saved WBRs:", error);
    return NextResponse.json(
      { error: "Failed to list saved WBRs" },
      { status: 500 }
    );
  }
}

// POST - Save a new WBR
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, wbrData, metrics } = body;

    if (!title || !wbrData) {
      return NextResponse.json(
        { error: "Missing title or wbrData" },
        { status: 400 }
      );
    }

    const id = Date.now().toString();
    const payload = {
      approvedAt: new Date().toISOString(),
      title,
      wbrData,
      metrics: metrics || [],
    };

    const blob = await put(`wbr/${id}.json`, JSON.stringify(payload), {
      contentType: "application/json",
      access: "public",
    });

    return NextResponse.json({
      id,
      url: blob.url,
      ...payload,
    });
  } catch (error) {
    console.error("Error saving WBR:", error);
    return NextResponse.json(
      { error: "Failed to save WBR" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a saved WBR
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Missing blob url" },
        { status: 400 }
      );
    }

    await del(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting WBR:", error);
    return NextResponse.json(
      { error: "Failed to delete WBR" },
      { status: 500 }
    );
  }
}
