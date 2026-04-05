import { prisma } from "../../../../prisma/db";
import {hashPassword} from "../../../../utils/auth";
import { NextResponse } from "next/server";
import {Role} from "../../../../utils/roles";
import {helper} from "../../../../utils/Helper";

export async function POST(request) {

    try {
        const {username, name, email, password, role} = await request.json();

        if (!username || !name || !email || !password || !role) {
            return NextResponse.json(
                {error: "Empty field exist"},
                {status: 400}
            );
        }

        if (!Object.values(Role).includes(role)) {
            return NextResponse.json(
                {error: "Invalid role"},
                {status: 400}
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                {error: "Password must be at least 8 characters"},
                {status: 400}
            );
        }
        var existingUser = await prisma.user.findUnique({where: {username: username}})

        if(existingUser) {
            return NextResponse.json(
                {error: "Username already exists"},
                {status: 400}
            );
        }

        const users = await prisma.user.findMany();

        existingUser = await prisma.user.findUnique(
            {where: {email_role: {email:email, role: role}}}
        )

        if(existingUser){
            return NextResponse.json(
                {error: "Already exists in the database as " + role},
                {status: 409}
            );
        }

        const user = await prisma.user.create({
            data: {
                username,
                name,
                email,
                password: await hashPassword(password),
                role,
            },
            select: {
                username: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return NextResponse.json(user, {status:200});
    }
    catch (error) {

        return helper.errors.INTERNAL_SERVER_ERROR(error);}
}
