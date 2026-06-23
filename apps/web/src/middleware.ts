import { NextResponse, type NextRequest } from "next/server";

const refreshCookieNames = ["billard_refresh", "billard_refresh_token"];
const roleCookieName = "billard_role";
const capabilitiesCookieName = "billard_capabilities";
const dashboardRoleBySegment: Record<string, string> = {
  admin: "ADMIN",
  organizer: "ORGANIZER",
  club: "CLUB",
  player: "PLAYER"
};

function hasSessionCookie(request: NextRequest) {
  return refreshCookieNames.some((cookieName) => Boolean(request.cookies.get(cookieName)?.value));
}

function isPublicPath(pathname: string) {
  return pathname.startsWith("/auth") || !pathname.startsWith("/dashboard");
}

function getRequiredRole(pathname: string) {
  const [, dashboardSegment, roleSegment] = pathname.split("/");
  if (dashboardSegment !== "dashboard" || !roleSegment) {
    return null;
  }

  return dashboardRoleBySegment[roleSegment] ?? null;
}

function dashboardPathForRole(role: string | undefined) {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "ORGANIZER":
      return "/dashboard/organizer";
    case "CLUB":
      return "/booking";
    case "PLAYER":
      return "/dashboard";
    default:
      return "/";
  }
}

function hasCapability(request: NextRequest, capability: string) {
  return (request.cookies.get(capabilitiesCookieName)?.value ?? "")
    .split(",")
    .map((item) => item.trim())
    .includes(capability);
}

function canAccessDashboardRole(request: NextRequest, actualRole: string | undefined, requiredRole: string) {
  if (actualRole === requiredRole) {
    return true;
  }

  if (requiredRole === "ADMIN" && hasCapability(request, "ADMIN_PANEL")) {
    return true;
  }

  if (requiredRole === "PLAYER" && hasCapability(request, "PLAYER_VIEW")) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/clubs") {
    return NextResponse.redirect(new URL("/booking", request.url));
  }

  if (pathname === "/reels" || pathname.startsWith("/reels/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(request)) {
    const signInUrl = new URL("/auth/signin", request.url);
    const nextPath = `${pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set("next", nextPath);
    signInUrl.searchParams.set("reason", "auth_required");
    return NextResponse.redirect(signInUrl);
  }

  const requiredRole = getRequiredRole(pathname);
  if (requiredRole) {
    const actualRole = request.cookies.get(roleCookieName)?.value;
    if (actualRole && !canAccessDashboardRole(request, actualRole, requiredRole)) {
      return NextResponse.redirect(new URL(dashboardPathForRole(actualRole), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"]
};
