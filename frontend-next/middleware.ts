import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth/login", "/api/auth/register", "/api/health"];

// Paths that must stay reachable even when the trial has expired and no
// licence key has been activated yet — otherwise there'd be no way to
// reach the activation form, or to sign out, once the app locks down.
const LICENSE_EXEMPT_PATHS = [
  "/maintenance/license",
  "/api/license/status",
  "/api/license/activate"
];

async function isLicenseValid(request: NextRequest): Promise<boolean> {
  try {
    const statusUrl = new URL("/api/license/status", request.url);
    const response = await fetch(statusUrl, {
      headers: { cookie: request.headers.get("cookie") ?? "" }
    });

    // Fail open: if the status check itself errors out (e.g. the database
    // is briefly unreachable), don't lock the whole app out over it.
    if (!response.ok) return true;

    const data = await response.json();
    return !data.requiresLicenseKey;
  } catch {
    return true;
  }
}

function isTokenValid(token: string): boolean {
  try {
    if (!token) return false;
    
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    
    // Decode payload
    const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString());
    
    // Check expiration
    if (decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) return false;
    }
    
    return true;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from localStorage via cookies (not available in middleware)
  // Instead, check the Authorization header or cookie
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  const cookieToken = request.cookies.get("mcstap_token")?.value;
  const activeToken = token || cookieToken;

  const isPublicPath =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.\w+$/); // Matches files with extensions

  // If path is public, allow access
  if (isPublicPath) {
    // If user has valid token and tries to access login, redirect to dashboard
    if ((pathname === "/login" || pathname === "/register") && isTokenValid(activeToken || "")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // For protected paths, token validation is not reliable in middleware
  // because localStorage is not accessible. Redirect to login and let
  // the page component handle token validation.
  if (!activeToken) {
    // Only redirect if it's not already a login-related path
    if (!pathname.includes("/login") && !pathname.includes("/register")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Authenticated from here on. Once the free trial has expired and no
  // licence key has been activated, lock the app down to the licence page.
  const isLicenseExempt = LICENSE_EXEMPT_PATHS.some(
    (exempt) => pathname === exempt || pathname.startsWith(`${exempt}/`)
  );

  if (!isLicenseExempt) {
    const licensed = await isLicenseValid(request);
    if (!licensed) {
      return NextResponse.redirect(new URL("/maintenance/license", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};
