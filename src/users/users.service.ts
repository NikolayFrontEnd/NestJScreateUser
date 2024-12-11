import { Injectable, BadRequestException, NotAcceptableException, NotFoundException  } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './user.dto';
import { Prisma } from '@prisma/client';
import { UpdateUserDto } from './updateUser.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async createUser(createUserDto: CreateUserDto) {
    const { login, name, password, roles } = createUserDto;
    const existingUser = await this.prisma.user.findUnique({
      where: { login },
    });

    if (existingUser) {
      throw new BadRequestException('Пользователь с этим логином уже существует!');
    }
    const rolesToConnect = await Promise.all(
      roles.map(async (roleName) => {

        const role = await this.prisma.role.upsert({
          where: { name: roleName },
          update: {},  
          create: { name: roleName }, 
        });
        return { id: role.id }; 
      })
    );
    const newUser = await this.prisma.user.create({
      data: {
        login,
        name,
        password,
        roles: {
          connect: rolesToConnect, 
        },
      },
      include: {
        roles: true, 
      },
    })
    return { success: true, user: newUser };
  }
  async findAllUsers(){  return await this.prisma.user.findMany({
      select:{
        login:true,
        name:true,
      }
    })
  }
  async findOneUser(login:string){
    const user = await this.prisma.user.findUnique({
      where:{login},
      select:{
        login:true,
        name:true,
        roles:true,
      }
    }) 
    if(!user){
      throw new NotFoundException("Пользователя не нашли!")
    }
    return user;
  }
  async deleteOneUser(login:string){
    const user = await this.prisma.user.findUnique({
      where:{login}
    })
    if(!user){
      throw new NotFoundException('Не нашли такого юзера!');
    }
       await this.prisma.user.delete({
      where:{login}
    })
    return{success:true,
      message: "Пользователь успешно удален!"
    }
  }
  async updateUser(login: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { login },
      include: { roles: true },
    });
    if (!user) {
      throw new NotFoundException(`User with login ${login} not found`);
    }
    const updateData: any = {};
  
    if (updateUserDto.name) {
      updateData.name = updateUserDto.name;
    }
    if (updateUserDto.roles) {
      const rolesPromises = updateUserDto.roles.map(async (roleName) => {
        const existingRole = await this.prisma.role.findUnique({
          where: { name: roleName },
        });
  
        if (existingRole) {
          return existingRole;
        }
  
        return this.prisma.role.create({
          data: { name: roleName },
        });
      });
  
      const roles = await Promise.all(rolesPromises);
      updateData.roles = {
        set: roles.map((role) => ({ id: role.id })), 
      };
    }
    const updatedUser = await this.prisma.user.update({
      where: { login },
      data: updateData,
      select: {
        login: true,
        name: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return updatedUser;
  }
}
