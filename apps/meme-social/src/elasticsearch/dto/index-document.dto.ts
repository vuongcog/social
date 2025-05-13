import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class IndexDocumentDto {
  @IsString()
  @IsNotEmpty()
  index: string;

  @IsString()
  id?: string; 

  @IsObject()
  @IsNotEmpty()
  body: Record<string, any>;
}
