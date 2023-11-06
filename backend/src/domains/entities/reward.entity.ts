import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity('rewards')
@Index(['chainId', 'tokenAddress', 'account'], { unique: true })
export class RewardEntity extends BaseEntity<RewardEntity> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'chain_id', type: 'integer' })
  chainId: number;

  @Column({ type: 'varchar' })
  account: string;

  @Column({ name: 'token_address', type: 'varchar', nullable: true })
  tokenAddress?: string;

  @Column({
    name: 'balance',
    type: 'varchar',
    transformer: {
      to: (value: bigint) => value,
      from: (value: string) => BigInt(value),
    },
  })
  balance: bigint;

  @Column({ name: 'block_number', type: 'integer', default: 0 })
  blockNumber: number;

  @Column({ name: 'log_index', type: 'integer', default: 0 })
  logIndex: number;
}
