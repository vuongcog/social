import { HttpException, HttpStatus, Inject, Injectable, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "../public.decorator";
import { KafkaService } from "../../kafka/kafka.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from "../passport/jwt.strategy";
import type { BaseResponse } from "@app/common";
import { throwCatchHtpp } from "@app/common/utils/http-throw-catch";
import { AuthKafkaService } from "../../kafka/auth/gateway.auth-kafka.service";

@Injectable()
export class JwtAuthGuard extends AuthGuard( 'jwt' ) {

    constructor(
        private reflector: Reflector,
        private readonly authKafkaService: AuthKafkaService,
        @Inject( CACHE_MANAGER ) private cacheManager: Cache,

        private jwtStrategy: JwtStrategy
    ) {
        super();
    }

    async canActivate( context: ExecutionContext ): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>( IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ] );

        if ( isPublic ) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if ( !authHeader || !authHeader.startsWith( 'Bearer ' ) ) {
            throw new UnauthorizedException( 'No token provided' );
        }

        const token = authHeader.split( ' ' )[ 1 ];

        const cacheKey = `validated_token:${ token }`;

        const cachedUser = await this.cacheManager.get( cacheKey );

        if ( cachedUser ) {
            request.user = cachedUser;
            return true;
        }

        try {

            const result: BaseResponse = await this.authKafkaService.validateToken( token );

            if ( !result.data ) {
                throw new UnauthorizedException( 'Invalid token' );
            }


            const userInfor = await this.jwtStrategy.validate( result.data );

            request.user = userInfor;

            return true;

        } catch ( error ) {
            throw throwCatchHtpp( error )
        }
    }
}   