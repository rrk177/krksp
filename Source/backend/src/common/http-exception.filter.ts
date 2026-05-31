import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { AppLoggerService } from '../logger/app-logger.service'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request  = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Внутренняя ошибка сервера'

    this.logger.error(
      `${request.method} ${request.url} → ${status}: ${JSON.stringify(message)}`,
      undefined,
      'ExceptionFilter',
    )

    response.status(status).json({
      statusCode: status,
      path:       request.url,
      timestamp:  new Date().toISOString(),
      message,
    })
  }
}
