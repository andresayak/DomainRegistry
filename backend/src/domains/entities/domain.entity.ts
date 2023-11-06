import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity('domains')
@Index(['chainId', 'name'], { unique: true })
@Index(['chainId', 'createdAt'])
@Index(['chainId', 'finishedAt'])
@Index(['parentId'])
export class DomainEntity extends BaseEntity<DomainEntity> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'chain_id', type: 'integer' })
  chainId: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  owner?: string;

  @Column({ name: 'parent_id', type: 'integer', nullable: true })
  parentId?: number;

  @Column({ name: 'additional_price', type: 'varchar', default: 0 })
  additionalPrice: bigint;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    nullable: true,
  })
  createdAt: Date;

  @Column({
    name: 'finished_at',
    type: 'timestamptz',
    nullable: true,
  })
  finishedAt: Date;
}
