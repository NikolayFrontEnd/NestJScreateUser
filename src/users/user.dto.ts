// users/dto/user.dto.ts

import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  name: string;


  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Пороль должен содержать минимум одну заглавную букву и цифру!',
  })
  password: string;

  @IsNotEmpty()
  roles: string[]; 
}
