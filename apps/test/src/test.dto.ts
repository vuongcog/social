import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class TestDto {
    @IsNotEmpty( { message: 'Tên không được để trống' } )
    @IsString( { message: 'Tên phải là chuỗi' } )
    name: string;

    @IsNotEmpty( { message: 'Email không được để trống' } )
    @IsEmail( {}, { message: 'Email không đúng định dạng' } )
    email: string;
}   