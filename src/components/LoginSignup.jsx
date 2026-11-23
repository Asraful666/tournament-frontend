import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../services/auth-store";
import { ALL_ROLES, ROLE_LABELS } from "../services/roles";

/**
 * Combined Sign in / Sign up screen used by the public /login and
 * /register routes. Both forms hit the real Django endpoints through
 * AuthProvider — no fake auth.
 *
 * `embedded` renders just the form card, because PublicLayout already
 * provides the TourneyHub branding and navigation beside it.
 */
export default function LoginSignup({ mode = "login", embedded = false }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage = location.state?.message || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(flashMessage);

  const isLogin = mode === "login";

  function change(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function switchMode(next) {
    setError("");
    setMessage("");
    navigate(next === "login" ? "/login" : "/register");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const email = form.email.trim();

    if (!email || !form.password) {
      setError("Email ও password দিতে হবে।");
      return;
    }

    if (!isLogin) {
      if (!form.name.trim()) {
        setError("Name লিখতে হবে।");
        return;
      }

      if (form.password.length < 8) {
        setError("Password কমপক্ষে ৮ অক্ষরের হতে হবে।");
        return;
      }

      if (form.password !== form.confirm) {
        setError("Password দুবার একই হতে হবে।");
        return;
      }
    }

    setBusy(true);

    try {
      if (isLogin) {
        await login(email, form.password);
        navigate("/dashboard", { replace: true });
      } else {
        await signup({
          name: form.name.trim(),
          email,
          password: form.password,
        });

        setForm((prev) => ({
          ...prev,
          password: "",
          confirm: "",
        }));
        navigate("/login", {
          replace: true,
          state: {
            message: `Account তৈরি হয়েছে (role: ${ROLE_LABELS.viewer})। এখন Sign in করো।`,
          },
        });
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`auth-screen${embedded ? " auth-screen-embedded" : ""}`}>
      <div className="auth-shell">
        {/* Left: product panel (standalone use only) */}
        {!embedded && (
          <aside className="auth-side">
            <div className="auth-side-brand">
              <span className="auth-logo" aria-hidden="true">
                🏆
              </span>
              <h1>TourneyHub</h1>
              <p>Sports Tournament Management System</p>
            </div>

            <ul className="auth-features">
              <li>
                <span aria-hidden="true">🏟️</span>
                Tournaments, teams, players, venues ও matches — সব একই
                dashboard-এ পরিচালনা করো।
              </li>
              <li>
                <span aria-hidden="true">🧮</span>
                প্রতিটা result দেওয়ার সাথে সাথে standings auto-update হয়
                (win 3, draw 1)।
              </li>
              <li>
                <span aria-hidden="true">🛡️</span>
                Object-level permissions — তুমি শুধু নিজের অনুমতির মধ্যে
                যা করতে পারো সেটাই দেখবে।
              </li>
            </ul>

            <div className="auth-roles" aria-label="Available roles">
              {ALL_ROLES.map((role) => (
                <span key={role}>{ROLE_LABELS[role]}</span>
              ))}
            </div>
          </aside>
        )}

        {/* Right: form panel */}
        <section className="auth-panel">
          <div className="auth-tabs" role="tablist" aria-label="Auth mode">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={isLogin ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={isLogin ? "" : "active"}
              onClick={() => switchMode("signup")}
            >
              Create account
            </button>
          </div>

          <h1 className="auth-title">
            {isLogin ? "Welcome back 👋" : "Create your account"}
          </h1>
          <p className="auth-subtitle">
            {isLogin
              ? "Login করো, তোমার role অনুযায়ী dashboard খুলে যাবে।"
              : "নতুন account শুধু email আর দুইবার password চায়।"}
          </p>

          <form className="auth-form" onSubmit={submit}>
            {!isLogin && (
              <label>
                Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="পুরো নাম"
                  required={!isLogin}
                />
              </label>
            )}

            <label>
              Email *
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                maxLength={150}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password * {isLogin ? "" : "(কমপক্ষে ৮ অক্ষর)"}
              <span className="passwd-wrap">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={change}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder={isLogin ? "তোমার password" : "নতুন password"}
                  required
                />
                <button
                  type="button"
                  className="passwd-toggle"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </span>
            </label>

            {!isLogin && (
              <>
                <label>
                  Confirm password *
                  <span className="passwd-wrap">
                    <input
                      name="confirm"
                      type={showConfirm ? "text" : "password"}
                      value={form.confirm}
                      onChange={change}
                      autoComplete="new-password"
                      placeholder="আবার লেখো"
                      required
                    />
                    <button
                      type="button"
                      className="passwd-toggle"
                      onClick={() => setShowConfirm((shown) => !shown)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? "🙈" : "👁️"}
                    </button>
                  </span>
                </label>

                <p className="auth-field-hint">
                  কমপক্ষে ৮ অক্ষর; সহজ/জনপ্রিয় password (যেমন 12345678,
                  password) আর তোমার নাম/email জাতীয় password backend নাগাল
                  ধরবে।
                </p>
              </>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={busy}
            >
              {busy
                ? "Processing..."
                : isLogin
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="success-box" role="status">
              {message}
            </p>
          )}

          <p className="auth-switch-hint">
            {isLogin ? (
              <>
                Account নেই?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                আগেই account আছে?{" "}
                <button type="button" onClick={() => switchMode("login")}>
                  Sign in
                </button>
              </>
            )}
          </p>

          {!isLogin && (
            <p className="auth-hint">
              নতুন signup হলে role হয়{" "}
              <strong>{ROLE_LABELS.viewer}</strong> — প্রয়োজনে Admin role
              পরিবর্তন করবে।
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
