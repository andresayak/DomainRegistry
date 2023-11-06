import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { RewardEntity } from '../entities';
import { Contract, Wallet } from 'ethers';
import { ConfigService } from '@nestjs/config';
import * as DomainRegistryAbi from '../../abi/DomainRegistryAbi.json';
import { ProviderFactory } from '../../system/provider.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { ChainIdPipe } from '../../common/chainId.pipe';

@Controller('rewards/:chainId')
@ApiTags('Rewards operations')
export class RewardController {
  constructor(
    @InjectRepository(RewardEntity)
    private readonly rewardRepository: Repository<RewardEntity>,
    private readonly configService: ConfigService,
    @Inject('MAIN_WALLET')
    private readonly wallet: Wallet,
    private readonly providerFactoryService: ProviderFactory,
  ) {}

  @Get('byAccount/:account')
  async byAccount(
    @Param('chainId', ChainIdPipe) chainId: number,
    @Param('account') account: string,
  ) {
    return this.rewardRepository.find({
      where: {
        chainId,
        account,
      },
    });
  }

  @Post('withdrawReward')
  async withdrawReward(
    @Param('chainId', ChainIdPipe) chainId: number,
    @Body()
    {
      account,
      tokenAddress,
    }: {
      account: string;
      tokenAddress: string;
    },
  ) {
    const reward = await this.rewardRepository.findOneBy({
      chainId,
      account,
      tokenAddress,
    });

    if (!reward || !reward.balance) {
      throw new BadRequestException('No reward to withdraw');
    }

    const provider = this.providerFactoryService.create(chainId, 'http');
    const wallet = this.wallet.connect(provider);
    const contractAddress = this.configService.get<string>(
      'DOMAIN_REGISTRY_ADDRESS_' + chainId,
    );
    if (!contractAddress) {
      throw new Error(`env DOMAIN_REGISTRY_ADDRESS_${chainId} not set`);
    }
    const contract = new Contract(contractAddress, DomainRegistryAbi, wallet);

    const tx = await contract.withdrawReward(account);
    return tx.hash;
  }

  @Post('withdrawRewardToken')
  async withdrawRewardToken(
    @Param('chainId', ChainIdPipe) chainId: number,
    @Body()
    {
      account,
      tokenAddress,
    }: {
      account: string;
      tokenAddress: string;
    },
  ) {
    const reward = await this.rewardRepository.findOneByOrFail({
      chainId,
      account,
      tokenAddress,
    });

    if (!reward.balance) {
      throw new BadRequestException('No reward to withdraw');
    }

    const provider = this.providerFactoryService.create(chainId, 'http');
    const wallet = this.wallet.connect(provider);
    const contractAddress = this.configService.get<string>(
      'DOMAIN_REGISTRY_ADDRESS_' + chainId,
    );
    if (!contractAddress) {
      throw new Error(`env DOMAIN_REGISTRY_ADDRESS_${chainId} not set`);
    }
    const contract = new Contract(contractAddress, DomainRegistryAbi, wallet);

    const tx = await contract.withdrawRewardToken(account, tokenAddress);
    return tx.hash;
  }
}
