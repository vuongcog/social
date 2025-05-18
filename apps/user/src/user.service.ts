// user-service/src/user/user.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@app/database';
import { User } from '@app/database/generated/prisma';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject( CACHE_MANAGER ) private cacheManager: Cache,
    ) { }

    async createUser( data: { email: string; name: string; password: string } ): Promise<User> {
        const hashedPassword = await bcrypt.hash( data.password, 10 );

        const user = await this.prisma.user.create( {
            data: {
                ...data,
                password: hashedPassword,
            },
        } );

        await this.cacheManager.del( `user:${ user.id }` );
        await this.cacheManager.del( `user:email:${ user.email }` );

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

    async findUserByEmail( email: string ): Promise<User | null> {
        const cacheKey = `user:email:${ email }`;

        const cachedUser = await this.cacheManager.get<User>( cacheKey );
        if ( cachedUser ) {
            return cachedUser;
        }

        const user = await this.prisma.user.findUnique( {
            where: { email },
        } );

        if ( user ) {
            await this.cacheManager.set( cacheKey, user, 600000 );
        }

        return user;
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

        return user;
    }
}