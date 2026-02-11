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
  deleted: boolean;
  is_bot: boolean;
  is_app_user: boolean;
  profile: {
    display_name: string;
    real_name: string;
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

    // Search channels (requires channels:read scope)
    const channelsResponse = await fetch(
      "https://slack.com/api/conversations.list?types=public_channel&exclude_archived=true&limit=500",
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
          query === "" || ch.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 15)
        .map((ch: SlackChannel) => ({
          id: ch.id,
          name: `#${ch.name}`,
          type: "channel" as const,
        }));

      results.push(...filteredChannels);
    }

    // Search users (requires users:read scope)
    const usersResponse = await fetch(
      "https://slack.com/api/users.list?limit=500",
      {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
      }
    );

    const usersData = await usersResponse.json();

    if (usersData.ok && usersData.members) {
      const filteredUsers = usersData.members
        .filter((user: SlackUser) => {
          // Exclude bots, deleted users, and app users
          if (user.deleted || user.is_bot || user.is_app_user) return false;
          // Exclude slackbot
          if (user.name === "slackbot") return false;

          const displayName = user.profile?.display_name || "";
          const realName = user.real_name || user.profile?.real_name || "";
          const userName = user.name || "";

          // If no query, return all active users
          if (query === "") return true;

          // Filter by query
          return (
            displayName.toLowerCase().includes(query.toLowerCase()) ||
            realName.toLowerCase().includes(query.toLowerCase()) ||
            userName.toLowerCase().includes(query.toLowerCase())
          );
        })
        .slice(0, 15)
        .map((user: SlackUser) => ({
          id: user.id,
          name: `@${user.profile?.display_name || user.real_name || user.name}`,
          type: "user" as const,
        }));

      results.push(...filteredUsers);
    }

    // Sort: channels first, then users, alphabetically within each group
    results.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "channel" ? -1 : 1;
    });

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error("Error fetching Slack channels/users:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels/users", details: String(error) },
      { status: 500 }
    );
  }
}
