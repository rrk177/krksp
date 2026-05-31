import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm'
import { Farm } from '../farms/farm.entity'

@Entity('cows')
export class Cow {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  breed: string

  @Column()
  age: number

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  weight: number

  // Статусы: healthy | sick | pregnant | dry
  @Column({ default: 'healthy' })
  status: string

  @Column({ name: 'farm_id', nullable: true })
  farmId: number

  @ManyToOne(() => Farm, { nullable: true, eager: false })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm

  @CreateDateColumn({ name: 'registered_at' })
  registeredAt: Date
}
