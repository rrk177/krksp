import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { CreateUserDto } from '../users/dto/create-user.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

// Контроллер авторизации
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  // POST /auth/login — войти в систему
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  // POST /auth/register — зарегистрироваться
  @Post('register')
  @HttpCode(201)
  register(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }

  // GET /auth/me — получить текущего пользователя (нужен токен)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id)
  }
}
