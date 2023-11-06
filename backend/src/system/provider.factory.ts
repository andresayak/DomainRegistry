import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class ProviderFactory {
  constructor(private readonly configService: ConfigService) {}

  create(chainId: number, type: 'ws' | 'http' = 'http') {
    const providerHttpUrl = this.configService.get(
      'PROVIDER_' + chainId + '_HTTP_URL',
    );
    const providerWsUrl = this.configService.get(
      'PROVIDER_' + chainId + '_WS_URL',
    );
    if (type == 'http') {
      if (!providerHttpUrl) {
        throw new Error('http url not set for provider [' + chainId + ']');
      }
      return new ethers.JsonRpcProvider(providerHttpUrl);
    }
    if (type == 'ws') {
      if (!providerWsUrl) {
        throw new Error('ws url not set for provider [' + chainId + ']');
      }
      return new ethers.WebSocketProvider(providerWsUrl);
    }
  }
}
