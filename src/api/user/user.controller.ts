import { Body, Controller, Get, Post, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDTO } from "./dto/create-user.dto";
import { LoggingInterceptor } from "./user.interceptor";

@UseInterceptors( LoggingInterceptor )
@Controller( "user" )
export class UserController {
    constructor( private userService: UserService ) { }

    @Post()
    async create( @Body() createUserDto: CreateUserDTO ) {
        return this.userService.createUser( createUserDto );
    }

    @Get()
    async findAll() {
        return this.userService.findAll();
    }
}

