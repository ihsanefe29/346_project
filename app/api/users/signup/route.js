import { prisma } from "../../../../prisma/db";
import { hashPassword } from "../../../../utils/auth";
import { NextResponse } from "next/server";
import { Role } from "../../../../utils/roles";
import { helper } from "../../../../utils/Helper";

export async function POST(request) {
    try {
        const { username, name, email, password, role } = await request.json();

        if (!username || !name || !email || !password || !role) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Role must be one of the defined roles
        if (!Object.values(Role).includes(role.toUpperCase())) {
            return NextResponse.json(
                { error: "Invalid role" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) {
            return NextResponse.json(
                { error: "Username already exists" },
                { status: 409 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email_role: { email, role: role.toUpperCase() } }
        });
        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email already exists as " + role },
                { status: 409 }
            );
        }

        const user = await prisma.user.create({
            data: {
                username,
                name,
                email,
                password: await hashPassword(password),
                role: role.toUpperCase(),
            },
            select: {
                username: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}
