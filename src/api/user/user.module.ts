import { Module, type MiddlewareConsumer, type NestModule } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { PrismaService } from "src/prisma/prisma.service";
import { UserMiddleware } from "./user.middleware";

@Module( {
    imports: [],
    controllers: [ UserController ],
    providers: [ UserService ],
    exports: [ UserService ]
} )
export class UserModule implements NestModule {
    configure( consumer: MiddlewareConsumer ) {
        consumer.apply( UserMiddleware ).forRoutes( "user" );
    }
}