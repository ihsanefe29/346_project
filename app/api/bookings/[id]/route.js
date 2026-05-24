import { prisma } from "../../../../prisma/db";
import { NextResponse } from "next/server";
import { helper } from "../../../../utils/Helper";
import { GET as userRoute } from "../../users/route";

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
            where: { id: bookingId,userId: parseInt(responseData.user.userId), },
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
            return NextResponse.json({ error: "No such booking not found for the owner." }, { status: 404 });
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
            where: { id: bookingId, userId: userId, },
            select: { id: true, userId: true, eventId: true },
        });

        if (!booking) {
            return NextResponse.json({ error: "No such booking not found for the owner." }, { status: 404 });
        }

        await prisma.booking.delete({ where: { id: bookingId } });

        return NextResponse.json({ message: "Booking cancelled" }, { status: 200 });
    } catch (error) {
        return helper.errors.INTERNAL_SERVER_ERROR(error);
    }
}
