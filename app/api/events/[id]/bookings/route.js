import { GET as userRoute } from "../../../users/route";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../prisma/db";
import { helper } from "../../../../../utils/Helper";

export async function POST(request, { params }) {
    try {
        const response = await userRoute(request);
        const { id } = await params;

        if (response.status !== 200) {
            return response;
        }

        const responseData = await response.json();


        const eventId = parseInt(id);

        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }

        // Use a transaction to prevent race conditions on capacity check + create
        // Source: Prisma docs on interactive transactions
        const booking = await prisma.$transaction(async (tx) => {
            const event = await tx.event.findUnique({ where: { id: eventId } });

            if (!event) {
                throw { status: 404, error: "Event not found" };
            }

            if(responseData.user.userId == event.organizerId) {
                throw {status: 403, error: "You cannot book your own event!" };
            }

            const bookingCount = await tx.booking.count({ where: { eventId } });

            if (bookingCount >= event.capacity) {
                throw { status: 400, error: "Event is full" };
            }

            const existingBooking = await tx.booking.findFirst({
                where: { userId: responseData.user.userId, eventId }
            });

            if (existingBooking) {
                throw { status: 400, error: "You have already booked this event" };
            }

            return tx.booking.create({
                data: { userId: responseData.user.userId, eventId }
            });
        });

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        // Handle known business-logic errors thrown from inside the transaction
        if (error?.status && error?.error) {
            return NextResponse.json({ error: error.error }, { status: error.status });
        }
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}
