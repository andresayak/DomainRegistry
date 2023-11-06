import { Module } from '@nestjs/common';
import * as controllers from './controllers';

import { DatabaseModule } from '../database/database.module';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { ProviderFactory } from './provider.factory';
import { ethers, Mnemonic } from 'ethers';
import { ScannerService } from "./scanner.service";

@Module({
  imports: [DatabaseModule],
  controllers: Object.values(controllers),
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const redisClient = createClient({
          url: `redis://:${configService.get(
            'REDIS_PASSWORD',
          )}@${configService.get('REDIS_HOST')}:${configService.get(
            'REDIS_PORT',
            6379,
          )}`,
        });
        await redisClient.connect();
        return redisClient;
      },
      inject: [ConfigService],
    },
    {
      provide: 'CHAINS',
      useFactory: (configService: ConfigService): number[] => {
        const chains = configService
          .get('CHAINS');
        if(!chains){
          throw new Error('env CHAINS not set');
        }
        return chains.split(',')
          .map((chainId) => parseInt(chainId));
      },
      inject: [ConfigService],
    },
    {
      provide: 'MAIN_WALLET',
      useFactory: async (configService: ConfigService) => {
        return ethers.HDNodeWallet.fromMnemonic(
          Mnemonic.fromPhrase(
            configService.get<string>('MNEMONIC'),
          ),
        );
      },
      inject: [ConfigService],
    },
    ProviderFactory,
    ScannerService,
  ],
  exports: ['MAIN_WALLET', 'CHAINS', ProviderFactory],
})
export class SystemModule {}
