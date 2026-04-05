import {helper} from "../../../utils/Helper";
import {prisma} from "../../../prisma/db";
import {NextResponse} from "next/server";
import {GET as userRoute} from "../users/route";

export async function GET(){
    try{
        const events = await prisma.event.findMany({orderBy:{dateTime:"asc"}});
        return NextResponse.json(events, {status:200});
    }catch(error){return helper.errors.INTERNAL_SERVER_ERROR();}
}

export async function POST(request){
    try {
        const response = await userRoute(request);
        if(response.status !== 200){
            return response;
        }
        const responseData = await response.json();
        if(responseData.user.role !== "ORGANIZER"){
            return NextResponse.json({error:"Not authorized!"}, {status:403});
        }
        const {title, description, dateTime, capacity} = await request.json();
        if(!title || !description || !dateTime || !capacity){
            return NextResponse.json(
                {error: "Empty field exist"},
                {status: 400}
            );
        }

        if(capacity<0){
            return NextResponse.json(
                {error:"Please enter a valid capacity!"},
                {status:400});
        }
        //https://www.freecodecamp.org/news/how-to-validate-a-date-in-javascript/
        var date = new Date(Date.parse(dateTime));
        if(isNaN(date)){
            return NextResponse.json(
                {error:"Invalid date format."},
                {status:400});
        }
        const event = await prisma.event.create({
            data: {
                title,
                description,
                dateTime: date,
                capacity,
                organizerId: responseData.user.userId
            },
            select: {
                title: true,
                description: true,
                dateTime: true,
                capacity: true,
            },
        });
        return NextResponse.json(event, {status:200});

    }catch (error) {return helper.errors.INTERNAL_SERVER_ERROR(error);}
}