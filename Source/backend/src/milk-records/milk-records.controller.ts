import {
  Body, Controller, Delete, Get, HttpCode,
  Param, ParseIntPipe, Post, Query, UseGuards,
} from '@nestjs/common'
import { MilkRecordsService } from './milk-records.service'
import { CreateMilkRecordDto } from './dto/create-milk-record.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../users/user.entity'

// Контроллер записей надоя
@Controller('milk-records')
@UseGuards(JwtAuthGuard)
export class MilkRecordsController {
  constructor(private milkService: MilkRecordsService) {}

  // GET /milk-records?cowId=X — список записей
  @Get()
  findAll(@Query('cowId') cowId?: string) {
    return this.milkService.findAll(cowId ? parseInt(cowId) : undefined)
  }

  // GET /milk-records/total?date=YYYY-MM-DD — суммарный надой за дату
  @Get('total')
  getTotalByDate(@Query('date') date: string) {
    return this.milkService.getTotalByDate(date || new Date().toISOString().split('T')[0])
  }

  // GET /milk-records/:id — одна запись
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.milkService.findOne(id)
  }

  // POST /milk-records — добавить запись (admin, manager)
  @Post()
  @HttpCode(201)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() body: CreateMilkRecordDto) {
    return this.milkService.create(body)
  }

  // DELETE /milk-records/:id — удалить запись (admin)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.milkService.remove(id)
  }
}
