import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserDTO } from "./dto/create-user.dto";
import { KafkaProducer } from "src/kafka/kafka.producer";
import { PrismaClient } from "generated/prisma";

const prisma = new PrismaClient();
const kafkaProducer = new KafkaProducer();




@Injectable()
export class UserService {
    constructor( private prisma: PrismaService ) { }


    async createUser( userData ) {
        const user = await prisma.user.create( {
            data: userData
        } );

        await kafkaProducer.send( 'user-events', {
            key: user.id,
            value: JSON.stringify( {
                type: 'USER_CREATED',
                payload: user,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            } )
        } );

        return user;
    }

    async updateUser( id: string, userData ) {

        const user = await prisma.user.update( {
            where: { id },
            data: {
                ...userData, updated_at: new Date()
            }
        } )

        await kafkaProducer.send( 'user-events', {
            key: user.id,
            value: JSON.stringify( {
                type: 'USER_UPDATED',
                payload: user,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            } )
        } );

        return user;
    }



    async findAll() {
        return this.prisma.user.findMany();
    }
    async findByEmail( email: string ) {
        return this.prisma.user.findUnique( { where: { email } } )
    }


}



