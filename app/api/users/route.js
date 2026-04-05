import {generateToken, verifyRefreshToken, verifyToken} from "../../../utils/auth";

import { NextResponse } from "next/server";
import {helper} from "../../../utils/Helper";
import {prisma} from "../../../prisma/db";

export async function GET(request) {
    try {
        const auth = request.headers.get("authorization");
        if (!auth || auth.startsWith("Bearer ") === false) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        const authPayload = verifyToken(auth.split(" ")[1]);


        if (!authPayload) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        return NextResponse.json({
            message:
                "Hi there! You are authenticated. Your username is " +
                authPayload.username,
            user: {userId: authPayload.userId, email: authPayload.email, role: authPayload.role},
            status: 200
        });
    }
    catch (error) {return helper.errors.INTERNAL_SERVER_ERROR();}
}

export async function POST(request) {

    try {
        const auth = request.headers.get("authorization");

        if (!auth || auth.startsWith("Bearer ") === false) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        const token = auth.split(" ")[1];
        const authPayload = verifyRefreshToken(auth.split(" ")[1]);

        if (!authPayload) {
            return NextResponse.json({error: "Token not verified"}, {status: 401});
        }

        const auth_User = await prisma.user.findUnique({
            where: {id: authPayload.userId},
        })

        if(auth_User.refresh_token !== token){
            return NextResponse.json({ error: "Refresh token does not exist" }, { status: 403 });
        }

        const newToken = generateToken(auth_User);
        return NextResponse.json({ newToken }, { status: 200 });
    }
    catch (error) {return helper.errors.INTERNAL_SERVER_ERROR(error);}
}
