# Tournament Management System — Frontend SPA

React 19 + Vite 8 single-page app for the Tournament Management System.
Talks to the Django API in `../tournament-backend` (all requests go
through the Vite dev proxy, keeping the Django session cookie
same-origin and CORS-free during development).

## Technology stack

| Component | Note |
|-----------|------|
| React     | 19, plain `.jsx` (no TypeScript) |
| Vite      | 8 (dev server on 5173, or 5174 if taken) |
| ESLint    | `npm run lint` (0 errors expected) |
| Routing   | `HashRouter` (`react-router-dom` 7) — one route/page per module |

## Architecture

State flows top-down; the API layer is the only network boundary:

```
src/
  main.jsx                 entry; <HashRouter> wraps <AuthProvider> + <App/>
  App.jsx                  public/private route table + auth redirects; only
                           permitted modules become routes, unknown URLs fall
                           back to /dashboard/overview
  config/
    navigation.js          sidebar sections, route paths, page titles
  pages/
    AboutPage.jsx          public About/Welcome page (hero, about, features, CTA)
    AboutPage.css          About page styling + responsive breakpoints
    OverviewPage.jsx       role dashboard + summary statistics
    TeamsPage.jsx          one page per module; each renders its manager
    PlayersPage.jsx
    TournamentsPage.jsx
    VenuesPage.jsx
    RefereesPage.jsx
    MatchesPage.jsx
    TeamRegistrationPage.jsx
    MatchTeamsPage.jsx
    MatchRefereesPage.jsx
    ResultsPage.jsx
    StandingsPage.jsx
    UsersPage.jsx
  services/
    api.js                 apiRequest(); CSRF header; ApiError with status;
                           emits `auth:session-expired` on any 401
    auth-store.js          AuthContext + useAuth() (context only)
    roles.js               six-role vocabulary, normalization, write
                           matrix (WRITE_MATRIX), section visibility
  components/
    AuthProvider.jsx       session bootstrap (/csrf → /me), exposes
                           login/signup/logout; listens for 401 events
    AdminLayout.jsx        shared sidebar + top navbar + <Outlet/> + footer;
                           scrolls to top on route change
    PageHeader.jsx         page title/subtitle + optional actions
    LoginSignup.jsx        login/signup form, reused by /login and /register
    PublicLayout.jsx       public site shell: top navbar, mobile menu, footer
    PublicLayout.css       public navigation + footer styling
    Navbar.jsx             role chip, links, logout
    UserManager.jsx        admin-only users & roles (+ identity links)
    TournamentsManager.jsx tournaments CRUD (organizer sees own only)
    TeamsManager.jsx       teams CRUD (manager scoped to own team)
    PlayersManager.jsx     players CRUD (manager scoped to own team)
    MatchesManager.jsx     matches CRUD
    ResultsManager.jsx     results (referee sees only assigned matches)
    AssignmentsManager.jsx tournament-teams / match-teams / match-referees
    SimpleResourceManager.jsx  venues & referees
    StandingsManager.jsx   standings CRUD (derived fields server-side)
```

## Public site and routing

The app has two experiences:

| Route | Access | Content |
|-------|--------|---------|
| `#/` | public | `AboutPage` — hero, about, 10 feature sections, CTA |
| `#/about` | public | same About page (alias for `/`) |
| `#/login` | public | `LoginSignup mode="login"` |
| `#/register` | public | `LoginSignup mode="signup"` |
| `#/dashboard/*` | signed in | existing dashboard modules |

Public routes are wrapped in `PublicLayout` (horizontal top navbar with
About / Sign In / Register, plus a footer). `AboutPage` is a marketing
page, not part of the admin dashboard; `AdminLayout` is only used under
`/dashboard`.

Dashboard modules live under `/dashboard`: `#/dashboard/overview`,
`#/dashboard/teams`, `#/dashboard/tournament-teams`, … (see
`src/config/navigation.js`). Paths are hash-based, so browser refresh and
direct links work without server rewrites. The active sidebar item is
highlighted by `NavLink`; each route renders only its own page/manager.

Redirect rules enforced in `App.jsx`:

- Signed-out users hitting any `/dashboard/*` URL go to `#/login`.
- Signed-in users hitting `#/`, `#/login`, or `#/register` go to
  `#/dashboard`.
- Unknown URLs fall back to `#/dashboard` when signed in, otherwise `#/`.

The About page reuses `LoginSignup` for both auth routes (`mode` prop)
instead of a second auth implementation. Sign up posts to the existing
`/api/auth/signup/`; because that endpoint does not start a session, a
successful registration redirects to `#/login` with a success message,
and signing in lands on `#/dashboard`.

## Role-based dashboards

`roles.js` is the single source of role UI truth:

- `normalizeRole()` — legacy/mixed-case roles → one of the six canonical
  roles (unknown → `viewer`, fail-closed, mirroring the backend).
- `WRITE_MATRIX` — which role may edit which section; passed to managers
  as `readOnly` (hidden or disabled forms, not just styled).
- `SECTION_VISIBILITY` / `visibleSections()` — which whole dashboard
  sections a role even sees (sidebar, top nav and rendered panels).

The six dashboards collapse to one composition: *Admin* gets everything
incl. Users & Roles; *Organizer* gets tournament-centric management of
their own tournaments; *Referee* gets matches/results for assigned
matches only; *Team Manager* gets their team + players; *Player* and
*Viewer* get read-only views (Player's own-profile emphasis, Viewer
strictly no action affordances).

**Security note:** the frontend is convenience only — the backend
enforces every rule. Hiding a button here never replaces a permission.

## Authentication flow

1. `AuthProvider` calls `/api/auth/csrf/` then `/api/auth/me/`.
2. Valid session → user object with role; else `#/login`.
3. Successful login navigates to `#/dashboard`; logout returns to
   `#/login`.
4. `apiRequest` attaches `X-CSRFToken` (parsed from the cookie) to every
   non-GET and uses `credentials: "include"`.
5. Any 401 dispatches `auth:session-expired`; `AuthProvider` drops the
   user → back to the login screen automatically.
6. Refreshing the browser preserves a valid session (HttpOnly cookie).

## Setup & running

Prereqs: Node.js; the Django backend running on `127.0.0.1:8000` with
MySQL up (see backend README).

```bat
npm install
npm run dev
```

Dev server: `http://localhost:5173` (5174 fallback). Open
`http://localhost:5173/` for the public About page, or
`http://localhost:5173/#/dashboard/overview` to go straight to the
dashboard (redirects to login when signed out). The backend's
CORS/CSRF settings allow exactly localhost/127.0.0.1 on 5173/5174 — a
new port must be added to `CORS_ALLOWED_ORIGINS` **and**
`CSRF_TRUSTED_ORIGINS` in the backend `config/settings.py` or writes
will fail CSRF.

## Quality gates

```bat
npm run lint     # ESLint — must report 0 problems
npm run build    # production build to dist/
npm run preview  # serve the production build
```

There is no frontend test runner configured (see "Remaining work" in the
project audit); verification is via lint + build + manual/API-side tests.

## Gotchas

- To add a module: add its entry to `src/config/navigation.js`, create a
  page in `src/pages/`, and register it in `PAGE_COMPONENTS` in
  `src/App.jsx`. Do not render managers directly inside `AdminLayout`.
  New sections automatically get a `/dashboard/<id>` route.
- Public pages live outside `AdminLayout`; keep marketing-only components
  (`PublicLayout`, `AboutPage`) out of the dashboard.
- Do not bypass `apiRequest` with raw `fetch` — the CSRF token and the
  401-event plumbing live there (rules enforced by lint conventions).
- Files under `src/services/` must not contain JSX components
  (react-refresh rule); components live in `src/components/`.
- Bengali UI strings are intentional (and consistent across managers) —
  keep the tone if adding copy.
- `react-refresh/only-export-components`: a file exporting a component
  should not export other values (that's why `auth-store.js` and files
  in `services/` are separate from components).
