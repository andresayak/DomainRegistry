import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { TokenEntity } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { ChainIdPipe } from '../../common/chainId.pipe';

@Controller('tokens/:chainId')
@ApiTags('Tokens')
export class TokenController {
  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
  ) {}

  @Get()
  async byAccount(@Param('chainId', ChainIdPipe) chainId: number) {
    return this.tokenRepository.find({
      where: {
        chainId,
      },
    });
  }
}
