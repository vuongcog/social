import { console } from 'node:inspector/promises';
import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@app/database';
import { User } from '@app/database/generated/prisma';
import { KafkaService } from './kafka/kafka.service';
import chalk from 'chalk';
import { printInformation } from '@app/common/utils/print-information';
import { CONSTANTS, type BaseResponse } from '@app/common';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject( CACHE_MANAGER ) private cacheManager: Cache,
        private readonly userElasticSearchKafkaClient: KafkaService,
    ) { }

    async createUser( data: any ): Promise<BaseResponse> {

        try {
            const exitUser = await this.prisma.user.findUnique( {
                where: { email: data.email }
            } );

            if ( exitUser ) {
                throw ( {
                    status: "error",
                    error: {
                        primaryMessage: `Email ${ data.email } is exited in database `
                    }
                } ) as BaseResponse;
            }

            const user = await this.prisma.user.create( {
                data,
            } );
            printInformation( user )

            // const indexDocument = await this.userElasticSearchKafkaClient.emitUserCreated( user );

            // if ( indexDocument ) {
            //     throw new ConflictException( 'not index to user' );
            // }

            return {
                status: "success",
                message: `Created User by Email ${ user.email }`,
                data: user,
            };
        }

        catch ( error: BaseResponse | any ) {
            if ( error.status ) {
                throw error as BaseResponse
            }
            else {
                throw {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse;
            }

        }

    }

    async updateUser( id: string, data: Partial<User> ): Promise<User> {
        const user = await this.prisma.user.update( {
            where: { id },
            data,
        } );

        const cacheKey = `user:${ id }`;
        await this.cacheManager.set( cacheKey, user, 600000 );
        if ( data.email ) {
            await this.cacheManager.del( `user:email:${ user.email }` );
        }
        await this.userElasticSearchKafkaClient.emitUserUpdated( user );


        return user;
    }

    async deleteUser( id: string ): Promise<User> {
        const user = await this.prisma.user.findUnique( {
            where: { id },
        } );

        if ( !user ) {
            throw new NotFoundException( `User with ID ${ id } not found` );
        }

        await this.prisma.user.delete( {
            where: { id },
        } );

        await this.cacheManager.del( `user:${ id }` );
        await this.cacheManager.del( `user:email:${ user.email }` );
        await this.userElasticSearchKafkaClient.emitUserDeleted( id );

        return user;
    }


    async findUserById( id: string ): Promise<User | null> {
        const cacheKey = `user:${ id }`;

        const cachedUser = await this.cacheManager.get<User>( cacheKey );
        if ( cachedUser ) {
            return cachedUser;
        }

        const user = await this.prisma.user.findUnique( {
            where: { id },
        } );

        if ( user ) {
            await this.cacheManager.set( cacheKey, user, 600000 );
        }

        return user;
    }

    async findUserByEmail( email: string ): Promise<BaseResponse<User>> {
        try {
            const cacheKey = `user:email:${ email }`;
            const cachedUser = await this.cacheManager.get<User>( cacheKey );

            if ( cachedUser ) {
                return {
                    status: 'success',
                    message: `Have User with Email ${ email } in cache `,
                    data: cachedUser
                };
            }

            const user = await this.prisma.user.findUnique( {
                where: { email },
            } );

            if ( !user ) {
                return {
                    status: 'success',
                    message: `User not found email ${ email } in anywhere`,
                };
            }

            await this.cacheManager.set( cacheKey, user, 600_000 );

            return {
                status: 'success',
                message: `Have User with Email ${ email } in database`,
                data: user,
            };

        } catch ( error: BaseResponse | any ) {
            if ( error.status ) {
                throw error as BaseResponse
            }
            else {
                throw {
                    status: 'error',
                    error: {
                        break: true,
                        details: error,
                    }
                } as BaseResponse;
            }

        }
    }




    async findAll() {
        return this.prisma.user.findMany();
    }

    async findById( id: string ) {
        return this.prisma.user.findUnique( {
            where: { id },
        } );
    }
}