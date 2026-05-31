import {
  IsEnum, IsNotEmpty, IsNumber,
  IsOptional, IsString, Max, Min,
} from 'class-validator'

const BREEDS = ['Holstein', 'Jersey', 'Angus', 'Hereford', 'Simmental', 'Limousin', 'Charolais'] as const
const STATUSES = ['healthy', 'sick', 'pregnant', 'dry'] as const

export class CreateCowDto {
  @IsNotEmpty({ message: 'Имя коровы обязательно' })
  @IsString()
  name: string

  @IsNotEmpty()
  @IsEnum(BREEDS, { message: 'Неизвестная порода' })
  breed: string

  @IsNumber()
  @Min(0)
  @Max(30)
  age: number

  @IsNumber()
  @Min(0)
  weight: number

  @IsOptional()
  @IsEnum(STATUSES, { message: 'Статус: healthy, sick, pregnant или dry' })
  status?: string

  @IsOptional()
  @IsNumber()
  farmId?: number
}
