import { BaseResponse } from './../interfaces/response.interface';
import { HttpStatus } from "@nestjs/common";
import type { Response } from "express";

export function responseData( res: Response, result: BaseResponse ) {
    if ( !result || !res ) {
        return res.status( result.statusCode ).json( {
            status: "error",
            messageo: "No data was returned ",
            statusCode: HttpStatus.BAD_GATEWAY,

        } as BaseResponse );
    }
    return res.status( result.statusCode || HttpStatus.BAD_REQUEST ).json( {
        ...result,
    } );

}