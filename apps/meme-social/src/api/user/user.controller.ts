import { Body, Controller, Get, Post, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDTO } from "./dto/create-user.dto";
import { LoggingInterceptor } from "./user.interceptor";
import { Public } from "src/auth/public.decorator";

@UseInterceptors( LoggingInterceptor )
@Controller( "user" )
export class UserController {
    constructor( private userService: UserService ) {
    }


    @Public()
    @Post()
    async create( @Body() createUserDto: any ) {

        return this.userService.create( createUserDto );

    }

    @Public()
    @Get()
    async findAll() {
        return this.userService.findAll();
    }
}

