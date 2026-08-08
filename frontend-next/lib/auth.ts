/**
 * Client-side authentication utilities for MCSTAP1
 * Uses localStorage for token persistence in the browser
 */

export const TOKEN_COOKIE = "mcstap_token";
export const REFRESH_TOKEN_COOKIE = "mcstap_refresh";

interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  is_active: boolean;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/**
 * Check if we're in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Set a cookie so the server-side middleware (which cannot read
 * localStorage) can see the auth token.
 */
function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Derive a cookie max-age from a JWT's exp claim, falling back to
 * a default when the token can't be decoded.
 */
function maxAgeFromToken(token: string, fallbackSeconds: number): number {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return fallbackSeconds;
    const decoded = JSON.parse(atob(parts[1]));
    if (!decoded.exp) return fallbackSeconds;
    const seconds = decoded.exp - Math.floor(Date.now() / 1000);
    return seconds > 0 ? seconds : fallbackSeconds;
  } catch {
    return fallbackSeconds;
  }
}

/**
 * Get the JWT access token from localStorage
 */
export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_COOKIE);
}

/**
 * Get the JWT refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_COOKIE);
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): User | null {
  if (!isBrowser()) return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

/**
 * Login user with credentials
 */
export async function login(username: string, password: string): Promise<AuthResponse | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();
    
    // Store tokens in localStorage
    if (isBrowser()) {
      localStorage.setItem(TOKEN_COOKIE, data.access_token);
      localStorage.setItem(REFRESH_TOKEN_COOKIE, data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    // Also set a cookie so the server-side middleware (which cannot
    // read localStorage) recognizes the session on the next navigation.
    setCookie(TOKEN_COOKIE, data.access_token, maxAgeFromToken(data.access_token, 3600));

    return data;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

/**
 * Refresh the access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await response.json();
    
    if (isBrowser()) {
      localStorage.setItem(TOKEN_COOKIE, data.access_token);
    }
    setCookie(TOKEN_COOKIE, data.access_token, maxAgeFromToken(data.access_token, 3600));

    return data.access_token;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

/**
 * Verify current token
 */
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/auth/verify`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Logout user
 */
export async function logout(token: string): Promise<boolean> {
  let ok = false;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
    });
    ok = response.ok;
  } catch (error) {
    console.error("Logout error:", error);
  }

  // Always clear local session state, even if the backend call failed
  // (expired token, network error) — a failed server call shouldn't be
  // able to trap the user in a signed-in state on their own client.
  if (isBrowser()) {
    localStorage.removeItem(TOKEN_COOKIE);
    localStorage.removeItem(REFRESH_TOKEN_COOKIE);
    localStorage.removeItem("user");
  }
  clearCookie(TOKEN_COOKIE);

  return ok;
}

/**
 * Register new user
 */
export async function register(
  username: string,
  email: string,
  password: string
): Promise<User | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Registration failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Registration error:", error);
    return null;
  }
}

/**
 * Get current user info
 */
export async function getCurrentUserInfo(token: string): Promise<User | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get user info error:", error);
    return null;
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(user: User | null, role: string): boolean {
  return user?.roles.includes(role) ?? false;
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, "admin");
}

/**
 * Decode JWT token to extract payload (without verification - use on client only)
 * WARNING: This does NOT verify the token signature. Use only for reading claims.
 */
export function decodeToken(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }
    
    // Decode the payload (second part)
    const decoded = JSON.parse(
      Buffer.from(parts[1], "base64").toString()
    );
    return decoded;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
}

/**
 * Utility to make authenticated API calls
 */
export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error("No authentication token available");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const url = `${apiUrl}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    "Authorization": `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    // Token might be expired, try to refresh
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const newToken = await refreshAccessToken(refreshToken);
      if (newToken) {
        // Retry with new token
        headers["Authorization"] = `Bearer ${newToken}`;
        return fetch(url, {
          ...options,
          headers,
          credentials: "include",
        }).then((res) => res.json());
      }
    }
    // If refresh fails, redirect to login
    if (isBrowser()) {
      window.location.href = "/login";
    }
  }

  return response.json();
}
