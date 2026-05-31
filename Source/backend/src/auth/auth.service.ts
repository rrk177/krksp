import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { AppLoggerService } from '../logger/app-logger.service'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logger: AppLoggerService,
  ) {}

  async login(dto: LoginDto) {
    this.logger.login(`Попытка входа: ${dto.email}`)

    const user = await this.usersService.findByEmail(dto.email)
    if (!user) {
      this.logger.warn(`Неудачный вход — пользователь не найден: ${dto.email}`, 'Auth')
      throw new UnauthorizedException('Неверный email или пароль')
    }

    const passwordOk = await bcrypt.compare(dto.password, user.password)
    if (!passwordOk) {
      this.logger.warn(`Неудачный вход — неверный пароль: ${dto.email}`, 'Auth')
      throw new UnauthorizedException('Неверный email или пароль')
    }

    this.logger.login(`Успешный вход: ${dto.email} (роль: ${user.role})`)

    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name }
    const token = this.jwtService.sign(payload)

    return {
      access_token: token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }
  }

  getProfile(userId: number) {
    this.logger.log(`Запрос профиля: ID ${userId}`, 'Auth')
    return this.usersService.findOne(userId)
  }
}
