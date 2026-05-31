import 'dotenv/config'
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, BadRequestException } from '@nestjs/common'
import { AppModule } from './app.module'
import { AppLoggerService } from './logger/app-logger.service'
import { HttpExceptionFilter } from './common/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const logger = new AppLoggerService()
  app.useLogger(logger)
  app.useGlobalFilters(new HttpExceptionFilter(logger))

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((e) =>
          Object.values(e.constraints || {}).join(', '),
        )
        return new BadRequestException({ message: messages, error: 'Validation failed' })
      },
    }),
  )

  await app.listen(3001)
  logger.log('Server running on http://localhost:3001', 'Bootstrap')
}

bootstrap()
