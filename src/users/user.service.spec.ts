import { Test, TestingModule } from '@nestjs/testing'; // Вспомогательные методы для тестирования
import { UsersService } from './users.service'; // Ваш сервис
import { PrismaService } from '../prisma.service'; // Сервис Prisma
import { BadRequestException, NotFoundException } from '@nestjs/common'; // Ошибки NestJS
import { CreateUserDto } from './user.dto'; // DTO для создания пользователя
import { UpdateUserDto } from './updateUser.dto';
const prismaServiceMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn()
  },
  role: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};
describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: PrismaService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });
  describe('createUser', () => {
    it('должен создать пользователя успешно', async () => {
      const createUserDto: CreateUserDto = {
        login: 'newuser',
        name: 'New User',
        password: 'Password123',
        roles: ['admin', 'user'],
      };
      prismaServiceMock.user.findUnique.mockResolvedValue(null); 
      prismaServiceMock.role.upsert.mockResolvedValue({ id: 1, name: 'admin' }); 
      prismaServiceMock.user.create.mockResolvedValue({
        login: 'newuser',
        name: 'New User',
        password: 'Password123',
        roles: [{ id: 1, name: 'admin' }],
      });
      const result = await usersService.createUser(createUserDto);
      expect(result.success).toBe(true);
      expect(result.user.login).toBe('newuser');
      expect(result.user.name).toBe('New User');
    });

    it('должна быть ошибка, если пользователь существует', async () => {
      const createUserDto: CreateUserDto = {
        login: 'existinguser',
        name: 'Existing User',
        password: 'Password123',
        roles: ['admin'],
      };
      prismaServiceMock.user.findUnique.mockResolvedValue({
        login: 'existinguser',
        name: 'Existing User',
        password: 'Password123',
        roles: [{ id: 1, name: 'admin' }],
      });
      await expect(usersService.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
  describe('deleteOneUser', () => {
    it('должен успешно удалить пользователя', async () => {
      const login = 'existinguser';
      prismaServiceMock.user.findUnique.mockResolvedValue({
        login: 'existinguser',
        name: 'Existing User',
        password: 'Password123',
        roles: [{ id: 1, name: 'admin' }],
      });
      prismaServiceMock.user.delete.mockResolvedValue({
        login: 'existinguser',
        name: 'Existing User',
        password: 'Password123',
        roles: [{ id: 1, name: 'admin' }],
      });
      const result = await usersService.deleteOneUser(login);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Пользователь успешно удален!');
    });

    it('должен выбросить ошибку NotFoundException, если пользователь не найден', async () => {
      const login = 'nonexistentuser';
      prismaServiceMock.user.findUnique.mockResolvedValue(null);
      await expect(usersService.deleteOneUser(login)).rejects.toThrow(
        NotFoundException,
      );
    });
  });


  describe('updateUser', () => {
    it('должен успешно обновить пользователя', async () => {
      const login = 'existinguser';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        roles: ['admin', 'manager'],
      };

      prismaServiceMock.user.findUnique.mockResolvedValue({
        login: 'existinguser',
        name: 'Existing User',
        roles: [{ id: 1, name: 'user' }],
      });

      // мокаем нахождение/создание ролей
      prismaServiceMock.role.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'admin',
      });
      prismaServiceMock.role.findUnique.mockResolvedValueOnce({
        id: 2,
        name: 'manager',
      });
      prismaServiceMock.user.update.mockResolvedValue({
        login: 'existinguser',
        name: 'Updated Name',
        roles: [
          { id: 1, name: 'admin' },
          { id: 2, name: 'manager' },
        ],
      });


      const result = await usersService.updateUser(login, updateUserDto);
      expect(result.name).toBe('Updated Name');
      expect(result.roles.length).toBe(2);
      expect(result.roles[0].name).toBe('admin');
      expect(result.roles[1].name).toBe('manager');
    });

    it('должен выбросить ошибку NotFoundException, если пользователь не найден', async () => {
      const login = 'nonexistentuser';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        roles: ['admin'],
      };
      prismaServiceMock.user.findUnique.mockResolvedValue(null);
      await expect(usersService.updateUser(login, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('должен создать новые роли, если они не существуют', async () => {
      const login = 'existinguser';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        roles: ['admin', 'newRole'],
      };
      prismaServiceMock.user.findUnique.mockResolvedValue({
        login: 'existinguser',
        name: 'Existing User',
        roles: [{ id: 1, name: 'user' }],
      });
      prismaServiceMock.role.findUnique.mockResolvedValueOnce(null); // Роль 'newRole' не найдена
      prismaServiceMock.role.create.mockResolvedValue({
        id: 3,
        name: 'newRole',
      });
      prismaServiceMock.user.update.mockResolvedValue({
        login: 'existinguser',
        name: 'Existing User',
        roles: [
          { id: 1, name: 'user' },
          { id: 3, name: 'newRole' },
        ],
      });
      const result = await usersService.updateUser(login, updateUserDto);
      expect(result.roles.length).toBe(2);
      expect(result.roles[1].name).toBe('newRole');
    });
  });
});


