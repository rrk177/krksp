import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CowsController } from './cows.controller'
import { CowsService } from './cows.service'
import { Cow } from './cow.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Cow])],
  controllers: [CowsController],
  providers: [CowsService],
})
export class CowsModule {}
