// proxy.js

import { NextResponse } from "next/server";

const requests = new Map();

export function proxy(request) {
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        "unknown";

    const now = Date.now();
    const limit = 5;
    const windowMs = 5 * 60 * 1000;

    const user = requests.get(ip);

    if (!user || now > user.resetTime) {
        requests.set(ip, { count: 1, resetTime: now + windowMs });
        return NextResponse.next();
    }

    if (user.count >= limit) {
        return NextResponse.json(
            { error: "Too many requests. Please try again 5 minutes later." },
            { status: 429 }
        );
    }

    user.count++;

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/users/:path*"],
};