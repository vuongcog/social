import { HttpStatus } from "@nestjs/common";
import type { BaseResponse } from "../interfaces";
import { CONSTANTS } from "../constants";

export function throwCatch( error ): BaseResponse {

    console.error( "Error details:", error );

    if ( CONSTANTS.STATUS_VALUES[ error?.status ] && error.statusCode ) {
        return error as BaseResponse
    }
    else {
        if ( 'stack' in error ) {
            delete error.stack;
        }
        const details = JSON.parse( JSON.stringify( error, Object.getOwnPropertyNames( error ) ) )
        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            status: 'error',
            message: 'Internal server error occurred',
            error: {
                details: details
            }
        } as BaseResponse;
    }
}