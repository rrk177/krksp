import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Cow } from './cow.entity'
import { CreateCowDto } from './dto/create-cow.dto'

// Сервис коров — работает с БД через TypeORM
@Injectable()
export class CowsService {
  constructor(
    @InjectRepository(Cow)
    private cowsRepo: Repository<Cow>,
    private dataSource: DataSource,
  ) {}

  // Получить список коров с фильтрами + среднее молоко из функции БД
  async findAll(breed?: string, status?: string, farmId?: number) {
    const fid = farmId ? Number(farmId) : null

    const rows = await this.dataSource.query(`
      SELECT
        c.id,
        c.name,
        c.breed,
        c.age,
        c.weight::FLOAT          AS weight,
        c.status,
        c.farm_id                AS "farmId",
        f.name                   AS "farmName",
        get_cow_avg_milk(c.id, 30)::FLOAT AS "avgMilk"
      FROM cows c
      LEFT JOIN farms f ON c.farm_id = f.id
      WHERE ($1::text IS NULL OR c.breed  = $1)
        AND ($2::text IS NULL OR c.status = $2)
        AND ($3::int  IS NULL OR c.farm_id = $3)
      ORDER BY c.name
    `, [breed || null, status || null, fid])

    return rows
  }

  // Найти одну корову по ID
  async findOne(id: number) {
    const cow = await this.cowsRepo.findOne({ where: { id }, relations: { farm: true } })
    if (!cow) {
      throw new NotFoundException(`Корова с ID ${id} не найдена`)
    }
    return cow
  }

  // Создать корову
  async create(dto: CreateCowDto) {
    const cow = this.cowsRepo.create({
      name: dto.name,
      breed: dto.breed,
      age: dto.age,
      weight: dto.weight,
      status: dto.status || 'healthy',
      farmId: dto.farmId,
    })
    return this.cowsRepo.save(cow)
  }

  // Обновить корову
  async update(id: number, dto: Partial<CreateCowDto>) {
    const cow = await this.cowsRepo.findOneBy({ id })
    if (!cow) {
      throw new NotFoundException(`Корова с ID ${id} не найдена`)
    }
    Object.assign(cow, dto)
    return this.cowsRepo.save(cow)
  }

  // Удалить корову
  async remove(id: number) {
    const cow = await this.cowsRepo.findOneBy({ id })
    if (!cow) {
      throw new NotFoundException(`Корова с ID ${id} не найдена`)
    }
    await this.cowsRepo.remove(cow)
    return { message: 'Корова удалена' }
  }

  // Статистика по поголовью — использует представление v_breed_stats
  async getStats() {
    // Данные из представления: порода, количество, средний вес, среднее молоко
    const breedStats: any[] = await this.dataSource.query(`
      SELECT breed, total, avg_weight::FLOAT AS avg_weight, avg_milk_per_day::FLOAT AS avg_milk_per_day
      FROM v_breed_stats
    `)

    // Распределение по статусам
    const statusRows: any[] = await this.dataSource.query(`
      SELECT status, COUNT(*)::INT AS cnt FROM cows GROUP BY status
    `)

    const total = breedStats.reduce((s, r) => s + Number(r.total), 0)
    const totalWeight = breedStats.reduce((s, r) => s + r.avg_weight * Number(r.total), 0)
    const totalMilk = breedStats.reduce((s, r) => s + r.avg_milk_per_day * Number(r.total), 0)

    const byBreed: Record<string, number> = {}
    const avgMilkByBreed: Record<string, number> = {}
    for (const r of breedStats) {
      byBreed[r.breed] = Number(r.total)
      avgMilkByBreed[r.breed] = Math.round(r.avg_milk_per_day * 10) / 10
    }

    const byStatus: Record<string, number> = {}
    for (const r of statusRows) {
      byStatus[r.status] = Number(r.cnt)
    }

    return {
      total,
      byBreed,
      byStatus,
      avgMilkByBreed,
      avgWeight: total > 0 ? Math.round(totalWeight / total * 10) / 10 : 0,
      avgMilkPerDay: total > 0 ? Math.round(totalMilk / total * 10) / 10 : 0,
      healthyCount: byStatus['healthy'] || 0,
      pregnantCount: byStatus['pregnant'] || 0,
    }
  }
}
