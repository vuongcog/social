import type { HttpStatus } from "@nestjs/common";


export interface BaseResponse<T = any> {
    statusCode: HttpStatus,
    status: 'success' | 'error';
    data?: T;
    message?: string,
    messages?: string,
    accessToken?: string,
    refresh?: string,
    error?: {
        message?: string,
        break?: boolean,
        typeError?: string,
        code?: string;
        messages?: string[];
        primaryMessage?: string;
        details?: any;
    };
}
