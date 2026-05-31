import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Farm } from './farm.entity'
import { CreateFarmDto } from './dto/create-farm.dto'

// Сервис ферм — CRUD операции
@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm)
    private farmsRepo: Repository<Farm>,
    private dataSource: DataSource,
  ) {}

  // Получить все фермы с количеством коров (из представления v_farm_summary)
  async findAll() {
    const rows = await this.dataSource.query(`
      SELECT id, name, location, cow_count, healthy_count, sick_count, pregnant_count
      FROM v_farm_summary
    `)
    return rows
  }

  // Найти ферму по ID
  async findOne(id: number) {
    const farm = await this.farmsRepo.findOneBy({ id })
    if (!farm) {
      throw new NotFoundException(`Ферма с ID ${id} не найдена`)
    }
    return farm
  }

  // Создать ферму
  async create(dto: CreateFarmDto) {
    const farm = this.farmsRepo.create(dto)
    return this.farmsRepo.save(farm)
  }

  // Обновить ферму
  async update(id: number, dto: Partial<CreateFarmDto>) {
    const farm = await this.farmsRepo.findOneBy({ id })
    if (!farm) {
      throw new NotFoundException(`Ферма с ID ${id} не найдена`)
    }
    Object.assign(farm, dto)
    return this.farmsRepo.save(farm)
  }

  // Удалить ферму
  async remove(id: number) {
    const farm = await this.farmsRepo.findOneBy({ id })
    if (!farm) {
      throw new NotFoundException(`Ферма с ID ${id} не найдена`)
    }
    await this.farmsRepo.remove(farm)
    return { message: 'Ферма удалена' }
  }

  // Перевести корову на другую ферму (через хранимую процедуру)
  async transferCow(cowId: number, newFarmId: number) {
    await this.dataSource.query('CALL transfer_cow($1, $2)', [cowId, newFarmId])
    return { message: `Корова ${cowId} переведена на ферму ${newFarmId}` }
  }
}
