import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ProviderFactory } from './provider.factory';
import { ethers } from 'ethers';
import { BlockListenerService } from './block-listener.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { RedisClientType } from 'redis';
import * as process from 'process';

@Injectable()
export class ScannerService implements OnModuleInit, OnModuleDestroy {
  private listeners: BlockListenerService[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly providerFactoryService: ProviderFactory,
    @Inject('CHAINS')
    private readonly chains: number[],
    @Inject('REDIS_CLIENT')
    private readonly redis: RedisClientType,
  ) {}

  public async onModuleInit() {
    if (process.env.NODE_ENV == 'test') return;
    await this.createListeners();
    this.listeners.map((listener) => listener.init());
  }

  public async onModuleDestroy() {
    await Promise.all(this.listeners.map((listener) => listener.destroy()));
  }

  private create(chainId: number): ethers.JsonRpcProvider {
    return this.providerFactoryService.create(chainId) as ethers.JsonRpcProvider;
  }

  private async createListeners() {
    for (const chainId of this.chains) {
      const contractAddress = this.configService.get<string>('DOMAIN_REGISTRY_ADDRESS_' + chainId);
      const contractDeployedBlock = parseInt(this.configService.get<string>('DOMAIN_REGISTRY_BLOCK_' + chainId));
      if (!contractAddress) {
        return false;
      }
      console.log('DOMAIN_REGISTRY_ADDRESS', contractAddress);
      console.log('DOMAIN_REGISTRY_BLOCK', contractDeployedBlock);
      const provider = this.create(chainId);
      const lastBlock = parseInt(await this.redis.get('block_processed_' + chainId));
      //const lastBlock = 0;
      this.listeners.push(
        new BlockListenerService(
          this.eventEmitter,
          provider,
          chainId,
          contractAddress,
          lastBlock ? lastBlock : contractDeployedBlock,
        ),
      );
    }
  }

  @OnEvent('blockProcessed', { async: true })
  handleBlockProcessed({ chainId, blockNumber }: { chainId: number; blockNumber: number }) {
    return this.redis.set('block_processed_' + chainId, blockNumber);
  }
}
