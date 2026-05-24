import { verifyToken } from "../../../utils/auth";
import { NextResponse } from "next/server";
import { helper } from "../../../utils/Helper";
import { prisma } from "../../../prisma/db";
import { generateToken, verifyRefreshToken } from "../../../utils/auth";

// Helper: read access token from HttpOnly cookie (falls back to Authorization header for API clients)
function extractToken(request) {
    const cookieToken = request.cookies.get("token")?.value;
    if (cookieToken) return cookieToken;

    const auth = request.headers.get("authorization");
    if (auth && auth.startsWith("Bearer ")) return auth.split(" ")[1];

    return null;
}

function extractRefreshToken(request) {
    const cookieToken = request.cookies.get("refresh_token")?.value;
    if (cookieToken) return cookieToken;

    const auth = request.headers.get("authorization");
    if (auth && auth.startsWith("Bearer ")) return auth.split(" ")[1];

    return null;
}

// GET /api/users — verify access token and return user info
export async function GET(request) {
    try {
        const token = extractToken(request);

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const authPayload = verifyToken(token);

        if (!authPayload) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({
            message:
                "Hi there! You are authenticated. Your username is " +
                authPayload.username,
            user: { userId: authPayload.userId, email: authPayload.email, role: authPayload.role },
            status: 200
        });
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}

// POST /api/users — refresh access token using refresh token cookie
export async function POST(request) {
    try {
        const token = extractRefreshToken(request);

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const authPayload = verifyRefreshToken(token);

        if (!authPayload) {
            return NextResponse.json({ error: "Token not verified" }, { status: 401 });
        }

        const auth_User = await prisma.user.findUnique({
            where: { id: authPayload.userId },
        });

        if (!auth_User) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (auth_User.refresh_token !== token) {
            return NextResponse.json({ error: "Refresh token does not match" }, { status: 403 });
        }

        // Only include safe fields in token payload (never the full DB row)
        const newToken = generateToken({
            userId: auth_User.id,
            username: auth_User.username,
            role: auth_User.role,
        });

        const response = NextResponse.json({ message: "Token refreshed" }, { status: 200 });

        response.cookies.set("token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60,
            path: "/",
        });

        return response;
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}
