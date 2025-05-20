

export interface BaseResponse<T = any> {
    status: 'success' | 'error';
    data?: T;
    message?: string,
    messages?: string,
    accessToken?: string,
    refresh?: string,
    error?: {
        break?: boolean,
        typeError?: string,
        code: string;
        messages?: string[];
        primaryMessage?: string;
        details?: any;
    };
}
