import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MilkRecordsController } from './milk-records.controller'
import { MilkRecordsService } from './milk-records.service'
import { MilkRecord } from './milk-record.entity'

@Module({
  imports: [TypeOrmModule.forFeature([MilkRecord])],
  controllers: [MilkRecordsController],
  providers: [MilkRecordsService],
})
export class MilkRecordsModule {}
