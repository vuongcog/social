import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserDTO } from "./dto/create-user.dto";

@Injectable()
export class UserService {
    constructor( private prisma: PrismaService ) { }
    async createUser( data: CreateUserDTO ) {
        return this.prisma.user.create( { data } );
    }
    async findAll() {
        return this.prisma.user.findMany();
    }
    async findByEmail( email: string ) {
        return this.prisma.user.findUnique( { where: { email } } )
    }
}



