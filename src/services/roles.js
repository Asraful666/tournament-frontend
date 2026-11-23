// Shared role vocabulary for the six application roles.
//
// Backend `users.role` values are stored lowercase (see
// tournaments/permissions.py); legacy mixed-case values are normalised
// here the same way the backend does it.

export const ROLES = {
  admin: "admin",
  organizer: "organizer",
  referee: "referee",
  team_manager: "team_manager",
  player: "player",
  viewer: "viewer",
};

export const ROLE_LABELS = {
  admin: "Admin",
  organizer: "Tournament Organizer",
  referee: "Referee",
  team_manager: "Team Manager",
  player: "Player",
  viewer: "Viewer",
};

export const ALL_ROLES = Object.keys(ROLES);

export function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "user") return ROLES.viewer;

  return ALL_ROLES.includes(value) ? value : ROLES.viewer;
}

// Which roles may edit which management section. Backend enforces the
// same rules server-side; this only drives UI affordances.
export const WRITE_MATRIX = {
  teams: ["admin", "organizer", "team_manager"],
  players: ["admin", "organizer", "team_manager"],
  tournaments: ["admin", "organizer"],
  venues: ["admin", "organizer"],
  referees: ["admin", "organizer"],
  matches: ["admin", "organizer"],
  "tournament-teams": ["admin", "organizer"],
  "match-teams": ["admin", "organizer"],
  "match-referees": ["admin", "organizer"],
  results: ["admin", "organizer", "referee"],
  standings: ["admin", "organizer"],
  users: ["admin"],
};

export function canEditSection(role, section) {
  const allowed = WRITE_MATRIX[section];
  return Boolean(allowed && allowed.includes(normalizeRole(role)));
}

// Which dashboard sections each role sees. The backend permission layer
// remains the authority; this only shapes the role dashboard UI so
// unauthorized actions are not even displayed.
const ASSIGNMENT_SECTIONS = ["tournament-teams", "match-teams", "match-referees"];
const MASTER_SECTIONS = ["venues", "referees"];

export const SECTION_VISIBILITY = {
  admin: () => true,
  organizer: (section) => section !== "users",
  referee: (section) =>
    section !== "users" && !ASSIGNMENT_SECTIONS.includes(section),
  team_manager: (section) =>
    section !== "users" &&
    !ASSIGNMENT_SECTIONS.includes(section) &&
    !MASTER_SECTIONS.includes(section),
  player: (section) =>
    section !== "users" &&
    !ASSIGNMENT_SECTIONS.includes(section) &&
    !MASTER_SECTIONS.includes(section),
  viewer: (section) => section !== "users",
};

export function canSeeSection(role, section) {
  const allowed = SECTION_VISIBILITY[normalizeRole(role)];
  return Boolean(allowed && allowed(section));
}

export function visibleSections(role, sections) {
  return sections.filter(({ id }) => canSeeSection(role, id));
}
