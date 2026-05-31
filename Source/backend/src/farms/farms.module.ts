import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FarmsController } from './farms.controller'
import { FarmsService } from './farms.service'
import { Farm } from './farm.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Farm])],
  controllers: [FarmsController],
  providers: [FarmsService],
})
export class FarmsModule {}
