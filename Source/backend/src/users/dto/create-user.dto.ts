import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Имя обязательно' })
  @IsString()
  name: string;

  @IsEmail({}, { message: 'Введите корректный email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;

  @IsOptional()
  @IsNumber({}, { message: 'Возраст должен быть числом' })
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Роль должна быть: admin, manager или viewer' })
  role?: UserRole;
}
