
import { useCallback, useEffect, useState } from "react";

import { AuthContext } from "../services/auth-store";
import { apiRequest } from "../services/api";
import { normalizeRole } from "../services/roles";

/**
 * Real backend session authentication.
 *
 * 1. Initializes CSRF cookie.
 * 2. Resolves logged-in user through /api/auth/me/.
 * 3. Supports login, signup and logout.
 * 4. Supports updating the logged-in user's own profile.
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing authentication session
  useEffect(() => {
    const controller = new AbortController();

    async function bootstrap() {
      try {
        await apiRequest("/api/auth/csrf/", {
          signal: controller.signal,
        });

        const me = await apiRequest("/api/auth/me/", {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setUser({
            ...me,
            role: normalizeRole(me.role),
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setUser(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    const onSessionExpired = () => setUser(null);

    window.addEventListener(
      "auth:session-expired",
      onSessionExpired
    );

    return () => {
      controller.abort();

      window.removeEventListener(
        "auth:session-expired",
        onSessionExpired
      );
    };
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    const me = await apiRequest("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const fresh = await apiRequest("/api/auth/me/");

    const currentUser = fresh ?? me;

    setUser({
      ...currentUser,
      role: normalizeRole(currentUser.role),
    });

    return currentUser;
  }, []);

  // Signup
  const signup = useCallback(
    async ({ name, email, password }) => {
      await apiRequest("/api/auth/signup/", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      return true;
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    await apiRequest("/api/auth/logout/", {
      method: "POST",
    });

    setUser(null);
  }, []);

  // Update logged-in user's profile
  const updateProfile = useCallback(async (changes) => {
    if (!user) {
      throw new Error("Please login first.");
    }

    const name = changes?.name?.trim();

    if (!name) {
      throw new Error("Full name is required.");
    }

    if (name.length > 100) {
      throw new Error(
        "Name must be within 100 characters."
      );
    }

    // Only the name field is accepted.
    // User ID, email, role and permissions cannot be changed.
    const updated = await apiRequest("/api/auth/me/", {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });

    setUser((current) => {
      if (!current) return current;

      return {
        ...current,
        ...updated,
        role: normalizeRole(
          updated.role ?? current.role
        ),
      };
    });

    return updated;
  }, [user]);

  // Auth context
  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
