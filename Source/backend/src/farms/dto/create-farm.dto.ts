import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateFarmDto {
  @IsNotEmpty({ message: 'Название фермы обязательно' })
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  location?: string
}
