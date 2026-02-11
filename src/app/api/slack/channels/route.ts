import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_private: boolean;
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    display_name: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  if (!SLACK_BOT_TOKEN) {
    return NextResponse.json(
      { error: "Slack token not configured" },
      { status: 500 }
    );
  }

  try {
    const results: Array<{ id: string; name: string; type: "channel" | "user" }> = [];

    // Search channels
    const channelsResponse = await fetch(
      "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=100",
      {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
      }
    );

    const channelsData = await channelsResponse.json();

    if (channelsData.ok && channelsData.channels) {
      const filteredChannels = channelsData.channels
        .filter((ch: SlackChannel) =>
          ch.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 10)
        .map((ch: SlackChannel) => ({
          id: ch.id,
          name: `#${ch.name}`,
          type: "channel" as const,
        }));

      results.push(...filteredChannels);
    }

    // Search users
    const usersResponse = await fetch(
      "https://slack.com/api/users.list?limit=100",
      {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
      }
    );

    const usersData = await usersResponse.json();

    if (usersData.ok && usersData.members) {
      const filteredUsers = usersData.members
        .filter(
          (user: SlackUser) =>
            !user.name.includes("bot") &&
            (user.real_name?.toLowerCase().includes(query.toLowerCase()) ||
              user.name?.toLowerCase().includes(query.toLowerCase()) ||
              user.profile?.display_name?.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 10)
        .map((user: SlackUser) => ({
          id: user.id,
          name: `@${user.profile?.display_name || user.real_name || user.name}`,
          type: "user" as const,
        }));

      results.push(...filteredUsers);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching Slack channels/users:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}
