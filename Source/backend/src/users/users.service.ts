import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User, UserRole } from './user.entity'
import { CreateUserDto } from './dto/create-user.dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.usersRepo.findOneBy({ email: dto.email })
    if (exists) {
      throw new ConflictException('Пользователь с таким email уже существует')
    }

    const hash = await bcrypt.hash(dto.password, 10)
    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      password: hash,
      role: dto.role || UserRole.VIEWER,
      age: dto.age,
    })

    const saved = await this.usersRepo.save(user)
    const { password, ...data } = saved
    return data
  }

  async findAll() {
    const users = await this.usersRepo.find({ order: { id: 'ASC' } })
    return users.map(u => {
      const { password, ...data } = u
      return data
    })
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findOneBy({ id })
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`)
    }
    const { password, ...data } = user
    return data
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOneBy({ email })
  }
}
