import { IsDateString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator'

export class CreateMilkRecordDto {
  @IsNotEmpty()
  @IsNumber()
  cowId: number

  @IsNumber()
  @Min(0.1, { message: 'Надой должен быть больше 0' })
  liters: number

  @IsOptional()
  @IsDateString({}, { message: 'Неверный формат даты' })
  recordedAt?: string

  @IsOptional()
  @IsNumber()
  recordedBy?: number
}
