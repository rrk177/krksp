import {
  Body, Controller, Get, HttpCode,
  Param, ParseIntPipe, Post, UseGuards,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from './user.entity'

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // GET /users — список всех пользователей
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getAll() {
    return this.usersService.findAll()
  }

  // GET /users/:id — пользователь по ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id)
  }

  // POST /users — создать пользователя
  @Post()
  @HttpCode(201)
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body)
  }
}
