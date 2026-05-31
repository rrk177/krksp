import {
  Body, Controller, Delete, Get, HttpCode,
  Param, ParseIntPipe, Post, Put, Query, UseGuards,
} from '@nestjs/common'
import { CowsService } from './cows.service'
import { CreateCowDto } from './dto/create-cow.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../users/user.entity'

// Контроллер коров — все запросы требуют авторизации
@Controller('cows')
@UseGuards(JwtAuthGuard)
export class CowsController {
  constructor(private cowsService: CowsService) {}

  // GET /cows?breed=Holstein&status=healthy&farmId=1 — список с фильтрами
  @Get()
  findAll(
    @Query('breed') breed?: string,
    @Query('status') status?: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.cowsService.findAll(breed, status, farmId ? parseInt(farmId) : undefined)
  }

  // GET /cows/stats — статистика по всему поголовью
  @Get('stats')
  getStats() {
    return this.cowsService.getStats()
  }

  // GET /cows/:id — одна корова
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cowsService.findOne(id)
  }

  // POST /cows — добавить корову (admin, manager)
  @Post()
  @HttpCode(201)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() body: CreateCowDto) {
    return this.cowsService.create(body)
  }

  // PUT /cows/:id — обновить корову (admin, manager)
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: CreateCowDto) {
    return this.cowsService.update(id, body)
  }

  // DELETE /cows/:id — удалить корову (только admin)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cowsService.remove(id)
  }
}
