import type { BaseResponse } from "../interfaces"

export function handlerResponseBreaker( result: BaseResponse ) {

    if ( result?.error ) {
        if ( result.error.break ) {
            throw result
        }
        return Promise.reject( result )
    }
    return result;


}