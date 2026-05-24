import { helper } from "../../../utils/Helper";
import { prisma } from "../../../prisma/db";
import { NextResponse } from "next/server";
import { GET as userRoute } from "../users/route";

// Public: list all events — organizerId is an internal FK, not exposed
export async function GET() {
    try {
        const events = await prisma.event.findMany({
            orderBy: { dateTime: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                dateTime: true,
                capacity: true,
                createdAt: true,
                _count: {
                    select: { bookings: true },
                },
            },
        });
        return NextResponse.json(events, { status: 200 });
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}

export async function POST(request) {
    try {
        const response = await userRoute(request);
        if (response.status !== 200) return response;

        const responseData = await response.json();
        if (responseData.user.role !== "ORGANIZER") {
            return NextResponse.json({ error: "Forbidden: organisers only" }, { status: 403 });
        }

        const { title, description, dateTime, capacity } = await request.json();

        if (!title || !description || !dateTime || capacity === undefined) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const capacityInt = parseInt(capacity);
        if (isNaN(capacityInt) || capacityInt <= 0) {
            return NextResponse.json({ error: "Capacity must be a positive integer" }, { status: 400 });
        }

        //https://www.freecodecamp.org/news/how-to-validate-a-date-in-javascript/
        const date = new Date(Date.parse(dateTime));
        if (isNaN(date.getTime())) {
            return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }

        const event = await prisma.event.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                dateTime: date,
                capacity: capacityInt,
                organizerId: responseData.user.userId,
            },
            select: {
                id: true,
                title: true,
                description: true,
                dateTime: true,
                capacity: true,
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}
