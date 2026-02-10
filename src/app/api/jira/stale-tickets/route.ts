import { NextResponse } from "next/server";

// Stale tickets from the board (In Progress/Testing) with no activity for 4+ days
// Based on real NTRVSTA data - filtered to show only tickets that need attention

export async function GET() {
  const today = new Date("2026-02-10"); // Current date

  const allBoardTickets = [
    {
      key: "NTRVSTA-466",
      summary: "Improve performance",
      status: "Testing",
      assignee: "Agustin Daverede",
      updated: "2026-02-09",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-466",
    },
    {
      key: "NTRVSTA-464",
      summary: "Platform - Improve API keys page and logic",
      status: "In Progress",
      assignee: "Rodrigo Gasha",
      updated: "2026-02-09",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-464",
    },
    {
      key: "NTRVSTA-463",
      summary: "Platform - Improve CI pipeline and test automation",
      status: "In Progress",
      assignee: "Rodrigo Gasha",
      updated: "2026-02-09",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-463",
    },
    {
      key: "NTRVSTA-446",
      summary: "Eleven Lab disconnects unexpectedly - error handling issue",
      status: "Testing",
      assignee: "Rodrigo Gasha",
      updated: "2026-02-09",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-446",
    },
    {
      key: "NTRVSTA-408",
      summary: "Add guardrail for media recording chunks",
      status: "Testing",
      assignee: "Rodrigo Gasha",
      updated: "2026-02-09",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-408",
    },
    {
      key: "NTRVSTA-460",
      summary: "Voice-only interview mode (LiveKit) - no avatar",
      status: "Testing",
      assignee: "Mauro Gilardenghi",
      updated: "2026-02-09",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-460",
    },
    {
      key: "NTRVSTA-462",
      summary: "UI Restyle/refresh of NTRVSTA application",
      status: "In Progress",
      assignee: "Agustin Daverede",
      updated: "2026-02-09",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-462",
    },
    {
      key: "NTRVSTA-459",
      summary: "Retrain Dito model for real-time streaming lip sync",
      status: "In Progress",
      assignee: "Mauro Gilardenghi",
      updated: "2026-02-09",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-459",
    },
    {
      key: "NTRVSTA-458",
      summary: "HeyGen API tokens changed - getting 401 unauthorized errors",
      status: "In Progress",
      assignee: "Rodrigo Gasha",
      updated: "2026-02-09",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-458",
    },
    {
      key: "NTRVSTA-450",
      summary: "Audit front-end performance - identify slow loading issues",
      status: "Testing",
      assignee: "Agustin Daverede",
      updated: "2026-02-09",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-450",
    },
    {
      key: "NTRVSTA-445",
      summary: "Avatar freezes when generating long speech responses",
      status: "In Progress",
      assignee: "Mauro Gilardenghi",
      updated: "2026-01-29",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-445",
    },
    {
      key: "NTRVSTA-448",
      summary: "Build Claude Code integration for automated ticket-to-PR pipeline",
      status: "In Progress",
      assignee: "Ieltxu Algañaras",
      updated: "2026-01-29",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-448",
    },
    {
      key: "NTRVSTA-421",
      summary: "Implement bulk test for E2E",
      status: "In Progress",
      assignee: "Agustin Daverede",
      updated: "2026-01-23",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-421",
    },
    {
      key: "NTRVSTA-413",
      summary: "Avatar Infrastructure & Scaling Strategy",
      status: "In Progress",
      assignee: "Ieltxu Algañaras",
      updated: "2026-01-19",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-413",
    },
    {
      key: "NTRVSTA-411",
      summary: "Avatar Platform Integration",
      status: "In Progress",
      assignee: "Ieltxu Algañaras",
      updated: "2026-01-19",
      url: "https://fittio.atlassian.net/browse/NTRVSTA-411",
    },
  ];

  // Calculate days stale and filter tickets > 4 days
  const staleTickets = allBoardTickets
    .map((ticket) => {
      const updatedDate = new Date(ticket.updated);
      const diffTime = today.getTime() - updatedDate.getTime();
      const daysStale = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return { ...ticket, daysStale };
    })
    .filter((ticket) => ticket.daysStale > 4)
    .sort((a, b) => b.daysStale - a.daysStale); // Most stale first

  return NextResponse.json({ tickets: staleTickets });
}
