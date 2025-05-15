import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { KafkaService } from '@app/kafka';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private kafkaService: KafkaService,
    ) { }

    async findAll() {
        return this.prisma.user.findMany( {
            select: {
                id: true,
                email: true,
                name: true,
            },
        } );
    }

    async findOne( id: string ) {
        return this.prisma.user.findUnique( {
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
            },
        } );
    }

    async update( id: string, data: { name?: string } ) {
        const user = await this.prisma.user.update( {
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
            },
        } );

        await this.kafkaService.produce( 'user.updated', user );

        return user;
    }

    async remove( id: string ) {
        await this.prisma.user.delete( { where: { id } } );

        await this.kafkaService.produce( 'user.deleted', { id } );

        return { success: true };
    }
}