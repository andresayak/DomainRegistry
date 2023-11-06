import { ethers } from 'ethers';
import * as DomainRegistryAbi from '../abi/DomainRegistryAbi.json';
import { EventEmitter2 } from '@nestjs/event-emitter';

export class BlockListenerService {
  private readonly iface: ethers.Interface = new ethers.Interface(
    DomainRegistryAbi,
  );
  private currentBlock: number;
  private synced = false;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly provider: ethers.WebSocketProvider,
    private readonly chainId: number,
    private readonly contractAddress: string,
    private lastBlock: number,
  ) {}

  async init() {
    this.currentBlock = await this.provider.getBlockNumber();
    this.provider.on('block', async (blockNumber: number) => {
      this.lastBlock = blockNumber;

      if (this.synced) {
        await this.processBlock(blockNumber);
        await this.processedBlock(blockNumber);
      }
    });
    if (this.lastBlock && this.currentBlock > this.lastBlock) {
      for (
        let blockNumber = this.lastBlock + 1;
        blockNumber <= this.currentBlock;
        blockNumber++
      ) {
        await this.processBlock(blockNumber);
        await this.processedBlock(blockNumber);
      }
    }
    this.synced = true;
  }

  async processBlock(blockNumber: number) {
    console.log('blockNumber', blockNumber);
    const logs = await this.provider.getLogs({
      fromBlock: blockNumber,
      toBlock: blockNumber,
    });

    const events = logs
      .map((log) => {
        if (log.address !== this.contractAddress) {
          return;
        }

        try {
          return this.iface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
        } catch (e) {
          console.error(e);
          return;
        }
      })
      .filter((e) => e);

    await this.eventEmitter.emitAsync('contractEvents', {
      chainId: this.chainId,
      blockNumber,
      events,
    });
  }

  processedBlock(blockNumber: number) {
    this.lastBlock = blockNumber;
    return this.eventEmitter.emitAsync('blockProcessed', {
      chainId: this.chainId,
      blockNumber,
    });
  }
}
