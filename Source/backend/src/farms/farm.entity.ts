import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column({ nullable: true })
  location: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
