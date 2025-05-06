import { Injectable, NestMiddleware } from "@nestjs/common";
import { Response, NextFunction, type Request } from "express";

@Injectable()
export class UserMiddleware implements NestMiddleware {
    use( req: Request, res: Response, next: NextFunction ) {
        console.log( `[UserMiddleware] ${ req.method } ${ req.originalUrl }` );
        next();
    }
}