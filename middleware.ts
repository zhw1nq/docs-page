import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect admin dashboard routes, not the login page
    if (pathname.startsWith("/admin/dashboard")) {
        const session = request.cookies.get("admin_session");

        if (!session?.value) {
            const loginUrl = new URL("/admin", request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/dashboard/:path*"],
};
