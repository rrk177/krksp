import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { CowsModule } from './cows/cows.module'
import { FarmsModule } from './farms/farms.module'
import { MilkRecordsModule } from './milk-records/milk-records.module'
import { DatabaseInitModule } from './database/database-init.module'
import { LoggerModule } from './logger/logger.module'
import { User } from './users/user.entity'
import { Farm } from './farms/farm.entity'
import { Cow } from './cows/cow.entity'
import { MilkRecord } from './milk-records/milk-record.entity'

// Корневой модуль приложения — объединяет все модули
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'cowfarm',
      entities: [User, Farm, Cow, MilkRecord],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    CowsModule,
    FarmsModule,
    MilkRecordsModule,
    DatabaseInitModule,
    LoggerModule,
  ],
})
export class AppModule {}
