import { NextResponse } from "next/server";
import { prisma } from "../../../../prisma/db";
import { generateToken, comparePassword, generateRefreshToken } from "../../../../utils/auth";
import { helper } from "../../../../utils/Helper";

export async function POST(request) {
    try {
        const body = await request.json();

        const username = body.username?.trim();
        const password = body.password?.trim();

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 },
            );
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user || !(await comparePassword(password, user.password))) {
            return NextResponse.json(
                { error: "Invalid username or password" },
                { status: 401 },
            );
        }

        const token = generateToken({ userId: user.id, username: user.username, role: user.role });
        const refresh_token = generateRefreshToken({ userId: user.id });

        await prisma.user.update({
            where: { id: user.id },
            data: { refresh_token },
        });

        const response = NextResponse.json(
            {
                user: {
                    id: user.id.toString(),
                    username: user.username,
                    role: user.role.toLowerCase(),
                },
            },
            { status: 200 }
        );

        // Access token: HttpOnly cookie, expires with session (1h matches JWT)
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60, // 1 hour
            path: "/",
        });

        // Refresh token: HttpOnly cookie, longer lived (15 days matches JWT)
        response.cookies.set("refresh_token", refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 15, // 15 days
            path: "/",
        });

        return response;
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}
