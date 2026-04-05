import {NextResponse} from "next/server";

export const helper ={

    errors: {
        INTERNAL_SERVER_ERROR: function (error) {
            console.error("ERROR:", error);
            console.error("ERROR CODE:", error?.code);
            console.error("ERROR META:", error?.meta);
            return NextResponse.json(
                {error: "INTERNAL_SERVER_ERROR"},
                {status: 500},
            );
        }
    }
}

