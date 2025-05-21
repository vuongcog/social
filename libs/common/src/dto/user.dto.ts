import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateDto {

    @IsString()
    @IsOptional()
    name: string;

    @IsEmail()
    @IsOptional()
    email: string


}
