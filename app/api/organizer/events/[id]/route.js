import { NextResponse } from "next/server";
import { prisma } from "../../../../../prisma/db";
import { helper } from "../../../../../utils/Helper";
import { GET as userRoute } from "../../../users/route";


export async function GET(request, { params }) {
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

        const eventOwner = await prisma.event.findUnique({
            where: { id: eventId },
            select: { organizerId: true },
        });

        if (!eventOwner) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (parseInt(responseData.user.userId) !== eventOwner.organizerId) {
            return NextResponse.json({ error: "Forbidden: you do not own this event" }, { status: 403 });
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
                bookings: {
                    select: {
                        id: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                username: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        return NextResponse.json(
            {
                event: {
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    dateTime: event.dateTime,
                    capacity: event.capacity,
                    createdAt: event.createdAt,
                },
                ticketsSold: event.bookings.length,
                ticketsRemaining: event.capacity - event.bookings.length,
                attendees: event.bookings.map(b => ({
                    bookingId: b.id,
                    bookedAt: b.createdAt,
                    name: b.user.name,
                    email: b.user.email,
                    username: b.user.username,
                })),
            },
            { status: 200 }
        );
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}
