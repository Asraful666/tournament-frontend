// Auth state container. Exposes only context + hook (no components in
// this file so the react-refresh eslint rule stays happy).
import { createContext, useContext } from "react";

export const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
