import {NextResponse} from "next/server";

export const helper ={

    errors: {
        INTERNAL_SERVER_ERROR: function () {
            return NextResponse.json(
                {error: "INTERNAL_SERVER_ERROR"},
                {status: 500},
            );
        }
    }
}

