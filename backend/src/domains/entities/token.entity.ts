import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from "../../common/base.entity";

@Entity('tokens')
@Index(['chainId', 'address'], { unique: true })
export class TokenEntity extends BaseEntity<TokenEntity>{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'chain_id',  type: 'integer' })
  chainId: number;

  @Column({ name: 'address', type: 'varchar' })
  address: string;

  @Column({ name: 'feed_address', type: 'varchar' })
  feedAddress: string;

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name?: string;

  @Column({ name: 'symbol', type: 'varchar', nullable: true })
  symbol?: string;

  @Column({ name: 'decimals', type: 'integer', nullable: true })
  decimals?: number;
}
