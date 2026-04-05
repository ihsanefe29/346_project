import {prisma} from "../../../../prisma/db";
import {NextResponse} from "next/server";
import {helper} from "../../../../utils/Helper";
import {console} from "next/dist/compiled/@edge-runtime/primitives";
import {GET as userRoute} from "../../users/route";

export async function GET(request,{params}) {
    try{
        const {id} = await params;
        const bookingId =  parseInt(id);

        if(isNaN(bookingId)){
            return NextResponse.json({error: "Invalid booking"}, {status: 400});
        }
        const booking = await prisma.booking.findUnique({where:{id:bookingId}});

        if(!booking){
            return NextResponse.json({error: "Booking not found"}, {status: 404});
        }
        return NextResponse.json(booking, {status:200});
    }catch(error){return helper.errors.INTERNAL_SERVER_ERROR();}
}

export async function DELETE(request, {params}) {
    try{
        const response = await userRoute(request);
        const {id} = await params;

        if(response.status !== 200){
            return response;
        }
        const responseData = await response.json();

        const bookingId =   parseInt(id);

        if(isNaN(bookingId)){
            return NextResponse.json({error: "Invalid booking"}, {status: 400});
        }
        const booking = await prisma.booking.findUnique({where:{id:bookingId}});

        if(!booking){
            return NextResponse.json({error: "Ticket not found"}, {status: 404});
        }

        if(parseInt(responseData.user.userId) !== booking.userId){
            return NextResponse.json({error: "Forbidden event"}, {status: 403});
        }

        await prisma.booking.delete({
            where: { id: bookingId},
        });
        return NextResponse.json({message: "Booking deleted", booking}, {status:200});

    }catch (error) {return helper.errors.INTERNAL_SERVER_ERROR(error);}
}
