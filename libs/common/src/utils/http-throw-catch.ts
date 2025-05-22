import { console } from 'node:inspector/promises';
import { BaseResponse } from './../interfaces/response.interface';
import { HttpException, HttpStatus } from "@nestjs/common"
import { CONSTANTS } from '../constants';

export function throwCatchHtpp( error: BaseResponse | any ) {

    if ( error instanceof Error ) {
        console.error( error.message );
    } else {
        console.error( error );
    }

    if ( CONSTANTS.STATUS_VALUES[ error?.status ] && error.statusCode ) {
        return new HttpException( error as BaseResponse, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }

    else {
        return new HttpException( {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            status: 'error',
            error: {
                details: error,
            }
        } as BaseResponse, HttpStatus.INTERNAL_SERVER_ERROR )
    }
}