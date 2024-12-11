import { IsString, IsOptional, Matches, IsArray } from 'class-validator';
export class UpdateUserDto {
  @IsOptional()  
  @IsString()
  name: string;
  @IsOptional()  
  @IsArray()
  roles: string[];
}