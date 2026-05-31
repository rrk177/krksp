import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Введите корректный email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString()
  password: string;
}
