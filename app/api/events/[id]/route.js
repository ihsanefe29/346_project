import { prisma } from "../../../../prisma/db";
import { NextResponse } from "next/server";
import { helper } from "../../../../utils/Helper";
import { GET as userRoute } from "../../users/route";

// Public: get a single event — organizerId hidden
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const eventId = parseInt(id);

        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                title: true,
                description: true,
                dateTime: true,
                capacity: true,
                createdAt: true,
                _count: { select: { bookings: true } },
            },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        return NextResponse.json(event, { status: 200 });
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}

// ORGANIZER (owner only): update an event — using PUT for REST correctness
export async function PUT(request, { params }) {
    try {
        const response = await userRoute(request);
        if (response.status !== 200) return response;

        const responseData = await response.json();
        if (responseData.user.role !== "ORGANIZER") {
            return NextResponse.json({ error: "Forbidden: organisers only" }, { status: 403 });
        }

        const { id } = await params;
        const eventId = parseInt(id);

        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }

        const event = await prisma.event.findUnique({ where: { id: eventId } });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Ownership check — must be the organizer who created this event
        if (parseInt(responseData.user.userId) !== event.organizerId) {
            return NextResponse.json({ error: "Forbidden: you do not own this event" }, { status: 403 });
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

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                title: title.trim(),
                description: description.trim(),
                dateTime: date,
                capacity: capacityInt,
            },
            select: {
                id: true,
                title: true,
                description: true,
                dateTime: true,
                capacity: true,
            },
        });

        return NextResponse.json({ message: "Event updated", event: updatedEvent }, { status: 200 });
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}

// ORGANIZER (owner only): delete an event
export async function DELETE(request, { params }) {
    try {
        const response = await userRoute(request);
        if (response.status !== 200) return response;

        const responseData = await response.json();
        if (responseData.user.role !== "ORGANIZER") {
            return NextResponse.json({ error: "Forbidden: organisers only" }, { status: 403 });
        }

        const { id } = await params;
        const eventId = parseInt(id);

        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }

        const event = await prisma.event.findUnique({ where: { id: eventId } });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (parseInt(responseData.user.userId) !== event.organizerId) {
            return NextResponse.json({ error: "Forbidden: you do not own this event" }, { status: 403 });
        }

        // Cascade delete handled by Prisma schema (onDelete: Cascade on Booking)
        await prisma.event.delete({ where: { id: eventId } });

        return NextResponse.json({ message: "Event deleted" }, { status: 200 });
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}
