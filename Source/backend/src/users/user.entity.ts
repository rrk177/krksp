import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column()
  password: string

  @Column({ nullable: true })
  age: number

  @Column({ default: 'viewer' })
  role: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  // Обновляется автоматически триггером в PostgreSQL
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
