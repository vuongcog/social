import { BaseResponse } from './../interfaces/response.interface';
import { HttpException, HttpStatus } from "@nestjs/common"

export function throwCatchHtpp( error ) {
    if ( error.status ) {
        return new HttpException( error as BaseResponse, HttpStatus.BAD_REQUEST,
        )
    }
    else {
        return new HttpException( {
            status: 'error',
            error: {
                details: error,
            }
        } as BaseResponse, HttpStatus.BAD_REQUEST )
    }
}