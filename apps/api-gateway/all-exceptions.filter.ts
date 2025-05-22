import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch( exception: unknown, host: ArgumentsHost ) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const errorResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    status: 'error',
                    error: { details: exception },
                };

        response.status( status ).json( errorResponse );
    }
}
