import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

// Admin credentials - In production, use environment variables and proper password hashing
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

function generateSessionToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password + SESSION_SECRET).digest("hex");
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Validate credentials
        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            return NextResponse.json(
                { error: "Invalid username or password" },
                { status: 401 }
            );
        }

        // Generate session token
        const sessionToken = generateSessionToken();
        const hashedToken = hashPassword(sessionToken);

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set("admin_session", hashedToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
