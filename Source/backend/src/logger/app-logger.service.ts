import { Injectable, LoggerService } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class AppLoggerService implements LoggerService {
  private logFile: string

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir)
    }
    this.logFile = path.join(logsDir, 'app.log')
  }

  private write(level: string, message: any, context?: string) {
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const line = `[${time}] [${level.toUpperCase()}] [${context || 'App'}] ${message}\n`
    console.log(line.trimEnd())
    fs.appendFileSync(this.logFile, line)
  }

  log(message: any, context?: string)   { this.write('info',  message, context) }
  error(message: any, _trace?: string, context?: string) { this.write('error', message, context) }
  warn(message: any, context?: string)  { this.write('warn',  message, context) }
  debug(message: any, context?: string) { this.write('debug', message, context) }
  login(message: any)                   { this.write('login', message) }
}
