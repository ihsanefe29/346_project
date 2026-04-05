import {prisma} from "../../../../prisma/db";
import {NextResponse} from "next/server";
import {helper} from "../../../../utils/Helper";
import {console} from "next/dist/compiled/@edge-runtime/primitives";
import {GET as userRoute} from "../../users/route";

export async function GET(request,{params}) {
    try{
        const {id} = await params;
        const eventId =  parseInt(id);

        if(isNaN(eventId)){
            return NextResponse.json({error: "Invalid event"}, {status: 400});
        }
        const event = await prisma.event.findUnique({where:{id:eventId}});

        if(!event){
            return NextResponse.json({error: "Event not found"}, {status: 404});
        }
        return NextResponse.json(event, {status:200});
    }catch(error){return helper.errors.INTERNAL_SERVER_ERROR();}
}

export async function POST(request,{params}) {
    try{
        const response = await userRoute(request);
        const {id} = await params;


        if(response.status !== 200){
            return response;
        }
        const responseData = await response.json();
        if(responseData.user.role !== "ORGANIZER"){
            return NextResponse.json({error:"Not authorized!"}, {status:403});
        }

        const eventId =   parseInt(id);

        if(isNaN(eventId)){
            return NextResponse.json({error: "Invalid event"}, {status: 400});
        }
        const event = await prisma.event.findUnique({where:{id:eventId}});

        if(!event){
            return NextResponse.json({error: "Event not found"}, {status: 404});
        }

        if(parseInt(responseData.user.userId) !== event.organizerId){
            return NextResponse.json({error: "Forbidden event"}, {status: 403});
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

        const event_Updated = await prisma.event.update({where:{id:eventId},
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
        return NextResponse.json({message: "event updated",event_Updated}, {status:200});

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
        if(responseData.user.role !== "ORGANIZER"){
            return NextResponse.json({error:"Not authorized!"}, {status:403});
        }

        const eventId =   parseInt(id);

        if(isNaN(eventId)){
            return NextResponse.json({error: "Invalid event"}, {status: 400});
        }
        const event = await prisma.event.findUnique({where:{id:eventId}});

        if(!event){
            return NextResponse.json({error: "Event not found"}, {status: 404});
        }

        if(parseInt(responseData.user.userId) !== event.organizerId){
            return NextResponse.json({error: "Forbidden event"}, {status: 403});
        }

        await prisma.booking.deleteMany({
            where: { eventId: eventId },
        });

        await prisma.event.delete({
            where: { id: eventId },
        });
        return NextResponse.json({message: "Event deleted", event}, {status:200});

    }catch (error) {return helper.errors.INTERNAL_SERVER_ERROR(error);}
}
