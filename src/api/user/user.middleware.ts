import { Injectable, NestMiddleware } from "@nestjs/common";
import { Response, NextFunction, type Request } from "express";
import { console } from "node:inspector/promises";

@Injectable()
export class UserMiddleware implements NestMiddleware {
    use( req: Request, res: Response, next: NextFunction ) {
        console.log( req.body )
        console.log( `[UserMiddleware] ${ req.method } ${ req.originalUrl }` );
        next();
    }
}