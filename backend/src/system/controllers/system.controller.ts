import { Controller, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainIdPipe } from '../../common/chainId.pipe';

@Controller('system')
export class SystemController {
  constructor(private readonly configService: ConfigService) {}

  @Get('main/:chainId')
  async main(@Param('chainId', ChainIdPipe) chainId: number) {
    const contractAddress = this.configService.get<string>(
      'DOMAIN_REGISTRY_ADDRESS_' + chainId,
    );

    return {
      DOMAIN_REGISTRY_ADDRESS: contractAddress,
    };
  }
}
