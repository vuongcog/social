import { HttpStatus } from "@nestjs/common";
import type { BaseResponse } from "../interfaces";
import { CONSTANTS } from "../constants";

export function throwCatchGateWay( error, gatewayService, serverService ): BaseResponse {

    console.error( "Error details:", error );

    if ( CONSTANTS.STATUS_VALUES[ error?.status ] && error.statusCode ) {
        return error as BaseResponse
    }
    else {
        return {
            statusCode: HttpStatus.BAD_GATEWAY,
            status: 'error',
            message: `${ gatewayService } is not connection ${ serverService }`,
            error: {
                details: error,
            }
        } as BaseResponse;
    }
}