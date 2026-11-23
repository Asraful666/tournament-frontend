
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../services/auth-store";
import { apiRequest } from "../services/api";
import {
  ROLE_LABELS,
  normalizeRole,
} from "../services/roles";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user?.name || "");

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await apiRequest("/api/auth/me/");

        if (active) {
          setProfile(data);
          setName(data.name || "");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Full name is required.");
      return;
    }

    if (cleanName.length > 100) {
      setError("Name cannot exceed 100 characters.");
      return;
    }

    setSaving(true);

    try {
      const updated = await updateProfile({
        name: cleanName,
      });

      setProfile((current) => ({
        ...current,
        ...updated,
      }));

      setName(updated.name);
      setEditing(false);

      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="profile-page">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="profile-page">Profile not available.</div>;
  }

  const role = normalizeRole(profile.role);

  return (
    <main className="profile-page">

      <div className="profile-heading">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal account information.</p>
        </div>

        <Link to="/dashboard/overview">
          Back to Dashboard
        </Link>
      </div>

      <section className="profile-header-card">

        <div className="profile-avatar">
          {(profile.name || "U").charAt(0).toUpperCase()}
        </div>

        <div className="profile-header-info">
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>

          <div className="profile-tags">
            <span>
              {ROLE_LABELS[role] || profile.role}
            </span>

            <span>Active Session</span>
          </div>
        </div>

        <button
          className="profile-edit-btn"
          onClick={() => {
            setName(profile.name || "");
            setEditing(true);
            setError("");
            setSuccess("");
          }}
        >
          Edit Profile
        </button>

      </section>

      {error && (
        <div className="profile-error">{error}</div>
      )}

      {success && (
        <div className="profile-success">{success}</div>
      )}

      {editing && (
        <form
          className="profile-edit-card"
          onSubmit={handleSave}
        >
          <h3>Edit Personal Information</h3>

          <label htmlFor="full-name">Full Name</label>

          <input
            id="full-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />

          <div className="profile-actions">
            <button
              type="submit"
              disabled={saving}
              className="profile-save-btn"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => setEditing(false)}
              className="profile-cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="profile-content-grid">

        <section className="profile-info-card">
          <h3>Personal Information</h3>

          <div className="profile-info-item">
            <span>Full Name</span>
            <strong>{profile.name}</strong>
          </div>

          <div className="profile-info-item">
            <span>Email Address</span>
            <strong>{profile.email}</strong>
          </div>

          <div className="profile-info-item">
            <span>User Role</span>
            <strong>{ROLE_LABELS[role] || profile.role}</strong>
          </div>
        </section>

        <section className="profile-info-card">
          <h3>Account Information</h3>

          <div className="profile-info-item">
            <span>User ID</span>
            <strong>{profile.user_id}</strong>
          </div>

          <div className="profile-info-item">
            <span>Account Status</span>
            <strong>Authenticated</strong>
          </div>

          <div className="profile-info-item">
            <span>Account Created</span>
            <strong>
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : "Not available"}
            </strong>
          </div>
        </section>

      </div>

    </main>
  );
}
