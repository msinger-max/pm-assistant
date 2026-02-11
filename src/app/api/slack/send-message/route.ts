import { NextResponse } from "next/server";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

export async function POST(request: Request) {
  try {
    const { channelId, message } = await request.json();

    if (!SLACK_BOT_TOKEN) {
      return NextResponse.json(
        { error: "Slack token not configured" },
        { status: 500 }
      );
    }

    if (!channelId || !message) {
      return NextResponse.json(
        { error: "Channel ID and message are required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel: channelId,
        text: message,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack API error:", data.error);
      return NextResponse.json(
        { error: data.error || "Failed to send message" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      channel: data.channel,
      ts: data.ts,
    });
  } catch (error) {
    console.error("Error sending Slack message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
