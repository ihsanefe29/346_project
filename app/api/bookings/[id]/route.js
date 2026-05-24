import { prisma } from "../../../../prisma/db";
import { NextResponse } from "next/server";
import { helper } from "../../../../utils/Helper";
import { GET as userRoute } from "../../users/route";

// Authenticated (owner only): get a single booking
export async function GET(request, { params }) {
    try {
        const response = await userRoute(request);
        if (response.status !== 200) return response;

        const responseData = await response.json();
        const { id } = await params;
        const bookingId = parseInt(id);

        if (isNaN(bookingId)) {
            return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                eventId: true,
                createdAt: true,
                event: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        dateTime: true,
                        capacity: true,
                    },
                },
            },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Ownership check: must re-fetch with userId to verify — userId intentionally
        // not included in the select above to avoid leaking it in the response
        const bookingOwner = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { userId: true },
        });

        if (parseInt(responseData.user.userId) !== bookingOwner.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(booking, { status: 200 });
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}

// Authenticated (owner only): cancel (delete) a booking
export async function DELETE(request, { params }) {
    try {
        const response = await userRoute(request);
        if (response.status !== 200) return response;

        const responseData = await response.json();
        const { id } = await params;
        const bookingId = parseInt(id);

        if (isNaN(bookingId)) {
            return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
        }

        // Fetch only the userId for the ownership check — never expose it in the response
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { id: true, userId: true, eventId: true },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (parseInt(responseData.user.userId) !== booking.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.booking.delete({ where: { id: bookingId } });

        return NextResponse.json({ message: "Booking cancelled" }, { status: 200 });
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}
