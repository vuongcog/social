import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
    @IsString()
    @IsEmail()
    email: string;

    @MinLength( 6 )
    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    provider?: string;

    @IsOptional()
    @IsString()
    providerId?: string;
}

export class LoginDto {
    
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;
}

export class TokenPayloadDto {
    userId: string;
    email: string;
}