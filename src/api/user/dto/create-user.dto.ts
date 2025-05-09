import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateUserDTO {
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
