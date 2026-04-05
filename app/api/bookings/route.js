import {helper} from "../../../utils/Helper";
import {prisma} from "../../../prisma/db";
import {NextResponse} from "next/server";
import {GET as userRoute} from "../users/route";

export async function GET(request){
    try{
        const response = await userRoute(request);

        if(response.status !== 200){
            return response;
        }
        const responseData = await response.json();
        const bookings = await prisma.booking.findMany({where:{userId:responseData.user.userId}});
        return NextResponse.json(bookings, {status:200});
    }catch(error){return helper.errors.INTERNAL_SERVER_ERROR();}
}