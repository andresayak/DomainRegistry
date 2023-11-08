import { OnEvent } from '@nestjs/event-emitter';
import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TokenEntity } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import * as console from 'console';
import { Contract, HDNodeWallet } from 'ethers';
import { ProviderFactory } from '../system/provider.factory';
import * as ERC20MetadataAbi from '../abi/ERC20MetadataAbi.json';

@Injectable()
export class TokenListener {
  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
    @Inject('MAIN_WALLET')
    private readonly wallet: HDNodeWallet,
    private readonly providerFactoryService: ProviderFactory,
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

  async handleContractEvent({ chainId, event }: any) {
    if (event.name === 'BaseTokenAdded') {
      const { token, feed } = event.args;
      console.log('BaseTokenAdded', {
        token,
        feed,
      });
      const { name, symbol, decimals } = await this.fetchTokenData(chainId, token);
      try {
        await this.tokenRepository.save(
          new TokenEntity({
            address: token,
            chainId,
            feedAddress: feed,
            name,
            symbol,
            decimals,
          }),
        );
      } catch (e) {
        if (!e.toString().match(/duplicate key value violates unique constraint/)) {
          throw e;
        }
      }
    }

    if (event.name === 'BaseTokenRemoved') {
      const { token } = event.args;
      console.log('BaseTokenRemoved', {
        token,
      });
      await this.tokenRepository.delete({
        address: token,
        chainId,
      });
    }
  }

  async fetchTokenData(chainId: number, tokenAddress: string) {
    const provider = this.providerFactoryService.create(chainId);
    const wallet = this.wallet.connect(provider);

    const contract = new Contract(tokenAddress, ERC20MetadataAbi, wallet);
    let name = '',
      symbol = '',
      decimals = null;
    try {
      name = await contract.name();
      symbol = await contract.symbol();
      decimals = await contract.decimals();
    } catch (e) {
      console.warn(e);
    }
    return {
      name,
      symbol,
      decimals,
    };
  }
}
