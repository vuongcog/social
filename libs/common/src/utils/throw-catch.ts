import type { BaseResponse } from "../interfaces";

export function throwCatch( error ): BaseResponse {
    // Lỗi dành cho hệ thống đã được wrapper hoặc được throw từ người dùng
    if ( error.status ) {
        return error as BaseResponse
    }
    // Lỗi dành cho hệ thống vừa được tạo mới và chưa được wrapper
    else {
        return {
            status: 'error',
            error: {
                details: error,
            }
        } as BaseResponse;
    }
}