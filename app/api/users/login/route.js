import { NextResponse } from "next/server";
import { prisma } from "../../../../prisma/db";
import {generateToken, comparePassword, generateRefreshToken} from "../../../../utils/auth";
import {helper} from "../../../../utils/Helper";

export async function POST(request) {
    const { username, password } = await request.json();

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

    try {
        const token = generateToken({userId: user.id, username: user.username, role: user.role});
        const refresh_token = generateRefreshToken({userId: user.id});
        await prisma.user.update({
            where: { id: user.id },
            data: { refresh_token },
        });
        return NextResponse.json({ token,refresh_token }, { status: 200 });
    }catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR();
    }
}
