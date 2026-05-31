import {
  Body, Controller, Delete, Get, HttpCode,
  Param, ParseIntPipe, Post, Put, UseGuards,
} from '@nestjs/common'
import { FarmsService } from './farms.service'
import { CreateFarmDto } from './dto/create-farm.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../users/user.entity'

// Контроллер ферм
@Controller('farms')
@UseGuards(JwtAuthGuard)
export class FarmsController {
  constructor(private farmsService: FarmsService) {}

  // GET /farms — список ферм со сводной статистикой
  @Get()
  findAll() {
    return this.farmsService.findAll()
  }

  // GET /farms/:id — одна ферма
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.farmsService.findOne(id)
  }

  // POST /farms — создать ферму (admin, manager)
  @Post()
  @HttpCode(201)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() body: CreateFarmDto) {
    return this.farmsService.create(body)
  }

  // PUT /farms/:id — обновить ферму (admin, manager)
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: CreateFarmDto) {
    return this.farmsService.update(id, body)
  }

  // DELETE /farms/:id — удалить ферму (только admin)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.farmsService.remove(id)
  }

  // POST /farms/transfer — перевод коровы на другую ферму (через процедуру)
  @Post('transfer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  transfer(@Body() body: { cowId: number; farmId: number }) {
    return this.farmsService.transferCow(body.cowId, body.farmId)
  }
}
