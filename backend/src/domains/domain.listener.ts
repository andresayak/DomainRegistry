import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { MoreThan, Repository } from 'typeorm';
import { RewardEntity, DomainEntity } from './entities';
import { InjectRepository } from '@nestjs/typeorm';

const getParentDomainName = (domain: string) => {
  const match = domain.match(/^[^\.]+\.(.+)$/);
  return match ? match[1] : null;
};

@Injectable()
export class DomainListener {
  constructor(
    @InjectRepository(RewardEntity)
    private readonly rewardRepository: Repository<RewardEntity>,
    @InjectRepository(DomainEntity)
    private readonly domainRepository: Repository<DomainEntity>,
  ) {}

  @OnEvent('contractEvents', { async: true })
  async handleContractEvents({ chainId, blockNumber, events }: any) {
    for (const event of events) {
      try {
        await this.handleContractEvent({
          chainId,
          blockNumber,
          event,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  async handleContractEvent({ chainId, blockNumber, event }: any) {
    const { logIndex } = event;
    if (event.name === 'DomainReserved' || event.name === 'DomainReservedByToken') {
      const {
        sender,
        domain,
        additionalPrice,
        createdAt,
        finishedAt,
      }: {
        sender: string;
        domain: string;
        additionalPrice: bigint;
        createdAt: bigint;
        finishedAt: bigint;
      } = event.args;
      console.log({
        sender,
        domain,
        additionalPrice,
        createdAt,
        finishedAt,
      });
      const parentDomainName = getParentDomainName(domain);
      let parentEntity;
      if (parentDomainName) {
        parentEntity = await this.domainRepository.findOne({
          where: {
            chainId,
            name: parentDomainName,
          },
        });
        if (!parentEntity) {
          parentEntity = await this.domainRepository.save(
            new DomainEntity({
              chainId,
              name: parentDomainName,
            }),
          );
        }
      }
      let domainEntity;
      const data = {
        chainId,
        name: domain,
        owner: sender,
        parentId: parentEntity ? parentEntity.id : null,
        additionalPrice: additionalPrice,
        createdAt: new Date(Number(createdAt * 1000n)),
        finishedAt: new Date(Number(finishedAt * 1000n)),
      };
      try {
        domainEntity = await this.domainRepository.save(new DomainEntity(data));
        console.log('domainEntity', domainEntity);
      } catch (e) {
        if (!e.toString().match(/duplicate key value violates unique constraint/)) {
          throw e;
        }
        await this.domainRepository.update(
          {
            chainId,
            name: domain,
          },
          data,
        );
      }
    }

    if (event.name === 'DomainContinue' || event.name === 'DomainContinueByToken') {
      const { domain, owner, finishedAt } = event.args;
      console.log('DomainContinue', {
        domain,
        owner,
        finishedAt,
      });
      const entity = await this.domainRepository.findOne({
        where: {
          chainId,
          name: domain,
        },
      });
      if (!entity) {
        throw new Error(`domain not found [${domain}]`);
      }
      await this.domainRepository.save(
        entity.fill({
          finishedAt,
        }),
      );
    }

    if (event.name === 'AdditionalPriceChanged') {
      const {
        domain,
        sender,
        amount,
      }: {
        domain: string;
        sender: string;
        amount: bigint;
      } = event.args;
      console.log('AdditionalPriceChanged', {
        domain,
        sender,
        amount,
      });
      const entity = await this.domainRepository.findOne({
        where: {
          chainId,
          name: domain,
        },
      });
      if (!entity) {
        throw new Error(`domain not found [${domain}]`);
      }
      await this.domainRepository.save(
        entity.fill({
          additionalPrice: amount,
        }),
      );
    }

    if (event.name === 'RewardAdded') {
      const {
        account,
        amount,
      }: {
        account: string;
        amount: bigint;
      } = event.args;

      console.log('RewardAdded', {
        account,
        amount,
      });

      const rewardEntity = await this.rewardRepository.findOne({
        where: {
          chainId,
          tokenAddress: null,
          account,
        },
      });

      if (rewardEntity) {
        await this.updateRewardBalance(rewardEntity, BigInt(rewardEntity.balance) + amount, blockNumber, logIndex);
      } else {
        await this.rewardRepository.save(
          new RewardEntity({
            chainId,
            tokenAddress: null,
            account,
            balance: amount.toString(),
            blockNumber,
            logIndex,
          }),
        );
      }
    }

    if (event.name === 'RewardAddedToken') {
      const { account, token, amount } = event.args;
      console.log('RewardAddedToken', {
        account,
        token,
        amount,
      });
      const rewardEntity = await this.rewardRepository.findOne({
        where: {
          chainId,
          tokenAddress: token,
          account,
        },
      });

      if (rewardEntity) {
        await this.updateRewardBalance(rewardEntity, BigInt(rewardEntity.balance) + amount, blockNumber, logIndex);
      } else {
        await this.rewardRepository.save(
          new RewardEntity({
            chainId,
            tokenAddress: token,
            account,
            balance: amount,
            blockNumber,
            logIndex,
          }),
        );
      }
    }

    if (event.name === 'WithdrawReward') {
      const { account, amount } = event.args;
      console.log('WithdrawReward', {
        account,
        amount,
      });
      const rewardEntity = await this.rewardRepository.findOne({
        where: {
          chainId,
          tokenAddress: null,
          account,
        },
      });
      await this.updateRewardBalance(rewardEntity, BigInt(rewardEntity.balance) - amount, blockNumber, logIndex);
    }

    if (event.name === 'WithdrawRewardToken') {
      const { account, token, amount } = event.args;
      console.log('WithdrawRewardToken', {
        account,
        token,
        amount,
      });

      const rewardEntity = await this.rewardRepository.findOne({
        where: {
          chainId,
          tokenAddress: token,
          account,
        },
      });
      await this.updateRewardBalance(rewardEntity, BigInt(rewardEntity.balance) - amount, blockNumber, logIndex);
    }
  }

  async updateRewardBalance(rewardEntity: RewardEntity, newBalance: bigint, blockNumber: number, logIndex: number) {
    const { affected } = await this.rewardRepository
      .createQueryBuilder()
      .update()
      .set({
        blockNumber,
        logIndex,
        balance: newBalance.toString(),
      })
      .where([
        {
          id: rewardEntity.id,
          blockNumber: MoreThan(blockNumber),
        },
        {
          id: rewardEntity.id,
          blockNumber,
          logIndex: MoreThan(logIndex),
        },
      ])
      .execute();
    if (!affected) {
      console.warn('updateRewardBalance not affected rows!');
    }
  }
}
