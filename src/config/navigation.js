// Sidebar sections and page metadata. `id` is the route path segment under
// the protected /dashboard route, so each module has a refresh-safe URL.
const DASHBOARD = "/dashboard";

export const NAV_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    path: `${DASHBOARD}/overview`,
    title: "Overview",
    subtitle: "সিস্টেমের সারসংক্ষেপ ও গুরুত্বপূর্ণ তথ্য।",
  },
  {
    id: "teams",
    label: "Teams",
    path: `${DASHBOARD}/teams`,
    title: "Teams",
    subtitle: "Team যোগ, সম্পাদনা, মুছে ফেলা ও তালিকা দেখা।",
  },
  {
    id: "players",
    label: "Players",
    path: `${DASHBOARD}/players`,
    title: "Players",
    subtitle: "Player যোগ, সম্পাদনা, মুছে ফেলা ও তালিকা দেখা।",
  },
  {
    id: "tournaments",
    label: "Tournaments",
    path: `${DASHBOARD}/tournaments`,
    title: "Tournaments",
    subtitle: "Tournament তৈরি, পরিচালনা ও দেখা।",
  },
  {
    id: "venues",
    label: "Venues",
    path: `${DASHBOARD}/venues`,
    title: "Venues",
    subtitle: "Tournament venue যোগ, সম্পাদনা ও দেখা।",
  },
  {
    id: "referees",
    label: "Referees",
    path: `${DASHBOARD}/referees`,
    title: "Referees",
    subtitle: "Referee যোগ, সম্পাদনা ও দেখা।",
  },
  {
    id: "matches",
    label: "Matches",
    path: `${DASHBOARD}/matches`,
    title: "Matches",
    subtitle: "Match schedule ও বিস্তারিত পরিচালনা।",
  },
  {
    id: "tournament-teams",
    label: "Team Registration",
    path: `${DASHBOARD}/tournament-teams`,
    title: "Team Registration",
    subtitle: "Tournament-এ team registration পরিচালনা।",
  },
  {
    id: "match-teams",
    label: "Match Teams",
    path: `${DASHBOARD}/match-teams`,
    title: "Match Teams",
    subtitle: "Match-এ team assignment পরিচালনা।",
  },
  {
    id: "match-referees",
    label: "Match Referees",
    path: `${DASHBOARD}/match-referees`,
    title: "Match Referees",
    subtitle: "Match-এ referee assignment পরিচালনা।",
  },
  {
    id: "results",
    label: "Results",
    path: `${DASHBOARD}/results`,
    title: "Results",
    subtitle: "Match result এন্ট্রি ও পরিচালনা।",
  },
  {
    id: "standings",
    label: "Standings",
    path: `${DASHBOARD}/standings`,
    title: "Standings",
    subtitle: "Tournament standings ও ranking।",
  },
  {
    id: "users",
    label: "Users & Roles",
    path: `${DASHBOARD}/users`,
    title: "Users & Roles",
    subtitle: "User, permission ও role পরিচালনা।",
  },
];

// The top navbar intentionally shows a shorter subset of the sidebar.
export const TOP_NAV_IDS = new Set([
  "overview",
  "tournaments",
  "matches",
  "results",
  "standings",
]);

export function getSection(id) {
  return NAV_SECTIONS.find((section) => section.id === id);
}
