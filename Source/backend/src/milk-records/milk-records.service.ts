import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { MilkRecord } from './milk-record.entity'
import { CreateMilkRecordDto } from './dto/create-milk-record.dto'

// Сервис записей надоя
@Injectable()
export class MilkRecordsService {
  constructor(
    @InjectRepository(MilkRecord)
    private milkRepo: Repository<MilkRecord>,
    private dataSource: DataSource,
  ) {}

  // Получить записи надоя с фильтром по корове
  async findAll(cowId?: number) {
    const where = cowId ? { cowId } : {}
    return this.milkRepo.find({
      where,
      order: { recordedAt: 'DESC', id: 'DESC' },
      take: 200,
    })
  }

  // Найти запись по ID
  async findOne(id: number) {
    const record = await this.milkRepo.findOneBy({ id })
    if (!record) {
      throw new NotFoundException(`Запись с ID ${id} не найдена`)
    }
    return record
  }

  // Создать запись надоя через хранимую процедуру (с валидацией сухостоя)
  async create(dto: CreateMilkRecordDto) {
    await this.dataSource.query(
      'CALL add_milk_record($1, $2, $3)',
      [dto.cowId, dto.liters, dto.recordedBy || null],
    )
    // Возвращаем последнюю добавленную запись для этой коровы
    const rows = await this.milkRepo.find({
      where: { cowId: dto.cowId },
      order: { id: 'DESC' },
      take: 1,
    })
    return rows[0]
  }

  // Удалить запись
  async remove(id: number) {
    const record = await this.milkRepo.findOneBy({ id })
    if (!record) {
      throw new NotFoundException(`Запись с ID ${id} не найдена`)
    }
    await this.milkRepo.remove(record)
    return { message: 'Запись удалена' }
  }

  // Суммарный надой за дату — через функцию БД
  async getTotalByDate(date: string) {
    const rows = await this.dataSource.query(
      'SELECT get_total_milk_by_date($1::DATE)::FLOAT AS total',
      [date],
    )
    return { date, total: rows[0]?.total ?? 0 }
  }
}
