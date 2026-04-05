import {helper} from "../../../../utils/Helper";
import {prisma} from "../../../../prisma/db";
import {NextResponse} from "next/server";
import {GET as userRoute} from "../../users/route";

export async function GET(request){
    try{
        const response = await userRoute(request);

        if(response.status !== 200){
            return response;
        }
        const responseData = await response.json();
        if(responseData.user.role !== "ORGANIZER"){
            return NextResponse.json({error:"Not authorized!"}, {status:403});
        }
        const events = await prisma.event.findMany({where:{organizerId:responseData.user.userId}});
        return NextResponse.json(events, {status:200});
    }catch(error){return helper.errors.INTERNAL_SERVER_ERROR();}
}