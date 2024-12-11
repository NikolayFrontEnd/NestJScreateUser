import { Controller, Get, Post, Body, ValidationPipe, Param, Delete, Patch,Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './user.dto';
import { UpdateUserDto } from './updateUser.dto';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }


  @Get()
  async getAllUsers(){
    const users = await this.usersService.findAllUsers();
    return {success: true, users} ;
  }


  @Get(  ':login')
  async getUser(@Param('login') login: string) {
    const user = await this.usersService.findOneUser(login);
    return { success: true, user };
  }

@Delete(":login")
async deleteUser(@Param('login') login: string) {
  const deletedUser = await this.usersService.deleteOneUser(login); return {success: true, deletedUser};
}
// я бы тут использовал patch, но в задании указано put, по-этому я сделаю с put. 
/* @Patch(':login')
  async updateUser(
    @Param('login') login: string, 
    @Body() updateUserDto: UpdateUserDto 
  ) {
    return await this.usersService.updateUser(login, updateUserDto);
  } */

    @Put(':login')  
    async update( @Param('login') login: string, @Body() updateUserDto: UpdateUserDto) {
      return this.usersService.updateUser(login, updateUserDto);
    }
  }

