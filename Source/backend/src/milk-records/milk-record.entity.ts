import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm'
import { Cow } from '../cows/cow.entity'
import { User } from '../users/user.entity'

@Entity('milk_records')
export class MilkRecord {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'cow_id' })
  cowId: number

  @ManyToOne(() => Cow, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'cow_id' })
  cow: Cow

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  liters: number

  // Дата записи надоя
  @Column({ name: 'recorded_at', type: 'date', default: () => 'CURRENT_DATE' })
  recordedAt: string

  @Column({ name: 'recorded_by', nullable: true })
  recordedBy: number

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'recorded_by' })
  recorder: User

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
