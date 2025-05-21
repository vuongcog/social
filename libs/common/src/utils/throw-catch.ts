import type { BaseResponse } from "../interfaces";

export function throwCatch( error ): BaseResponse {

    console.error( "Error details:", error );

    if ( error.status ) {
        return error as BaseResponse
    }
    else {
        return {
            status: 'error',
            error: {
                details: error,
            }
        } as BaseResponse;
    }
}