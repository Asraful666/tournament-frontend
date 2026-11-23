// Single API access point for the whole SPA.
//
// All requests go through the Vite dev proxy (relative `/api/...`), which
// keeps the Django session cookie working (same-origin behind the proxy)
// and avoids the CORS/cookie pitfalls of talking to 127.0.0.1:8000
// directly from a browser. Django CSRF token is added automatically for
// unsafe methods from the `csrftoken` cookie (/api/auth/csrf/ sets it).

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const API_PREFIX = "/api";

function toUrl(endpoint) {
  return endpoint.startsWith(API_PREFIX) ? endpoint : `${API_PREFIX}${endpoint}`;
}

function readCsrfToken() {
  const row = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="));

  // Return the token value only — the whole "csrftoken=..." row would be
  // sent as the header value and fail Django's CSRF check.
  return row ? decodeURIComponent(row.slice("csrftoken=".length)) : null;
}

function errorMessage(data, status) {
  if (typeof data === "string" && data) return data;

  if (data && typeof data === "object") {
    if (typeof data.error === "string" && data.error) return data.error;
    if (typeof data.detail === "string" && data.detail) return data.detail;
    if (typeof data.message === "string" && data.message) return data.message;

    const parts = Object.entries(data).map(([field, errors]) => {
      const text = Array.isArray(errors)
        ? errors.join(", ")
        : String(errors);
      return `${field}: ${text}`;
    });

    if (parts.length > 0) return parts.join(" | ");
  }

  return `Request failed: ${status}`;
}

export async function apiRequest(endpoint, options = {}) {
  const url = toUrl(endpoint);
  const method = (options.method || "GET").toUpperCase();

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = readCsrfToken();
    if (csrfToken) headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  let data = null;

  if (response.status !== 204) {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Session gone or never valid: let the auth layer react (e.g. show
      // the login screen again) without each caller having to care.
      window.dispatchEvent(new Event("auth:session-expired"));
    }

    throw new ApiError(errorMessage(data, response.status), response.status);
  }

  return data;
}
