import { NextResponse } from "next/server";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SENDER_USER_ID = process.env.SLACK_SENDER_USER_ID || "U09R810F272"; // Matias Singer

export async function POST(request: Request) {
  try {
    const { channelId, message, isUser } = await request.json();

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

    let targetChannel = channelId;

    // If sending to a user, open a group conversation (MPIM) that includes the sender
    if (isUser) {
      // Create a group DM with the sender and the recipient
      const openResponse = await fetch("https://slack.com/api/conversations.open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({
          users: `${SENDER_USER_ID},${channelId}`, // Include sender + recipient
        }),
      });

      const openData = await openResponse.json();

      if (!openData.ok) {
        console.error("Slack conversations.open error:", openData.error);
        return NextResponse.json(
          { error: openData.error || "Failed to open group conversation" },
          { status: 400 }
        );
      }

      // Use the group DM channel ID
      targetChannel = openData.channel.id;
    }

    // Send the message
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel: targetChannel,
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
