import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class ProviderFactory {
  constructor(private readonly configService: ConfigService) {}

  create(chainId: number) {
    const providerUrl = this.configService.get('PROVIDER_' + chainId + '_URL');

    if (!providerUrl) {
      throw new Error('http url not set for provider [' + chainId + ']');
    }
    return new ethers.JsonRpcProvider(providerUrl);
  }
}
