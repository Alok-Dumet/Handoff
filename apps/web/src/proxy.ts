import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { keylessReturnUrl } from "@/lib/keyless-return-url";

// Public pages that a signed-in user has no reason to see — they get
// bounced to their vehicles. (Sign-in/up catch-all sub-routes included.)
const isPublicOnlyRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const authMiddleware = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (userId && isPublicOnlyRoute(req)) {
    return NextResponse.redirect(new URL("/vehicles", req.url));
  }
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NODE_ENV === "development" && request.nextUrl.pathname === "/clerk-sync-keyless") {
    return NextResponse.redirect(keylessReturnUrl(request.url));
  }
  return authMiddleware(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
