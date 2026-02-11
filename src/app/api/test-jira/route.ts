import { NextResponse } from "next/server";

export async function GET() {
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const baseUrl = process.env.JIRA_BASE_URL;

  // Check if env vars exist
  const envCheck = {
    hasEmail: !!email,
    hasApiToken: !!apiToken,
    hasBaseUrl: !!baseUrl,
    emailValue: email ? email.substring(0, 5) + "..." : "undefined",
    baseUrlValue: baseUrl || "undefined",
  };

  if (!email || !apiToken || !baseUrl) {
    return NextResponse.json({ error: "Missing credentials", envCheck });
  }

  try {
    // Test simple API call
    const response = await fetch(
      `${baseUrl}/rest/api/3/myself`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      envCheck,
      user: response.ok ? { displayName: data.displayName, email: data.emailAddress } : null,
      error: !response.ok ? data : null,
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      envCheck,
    });
  }
}
