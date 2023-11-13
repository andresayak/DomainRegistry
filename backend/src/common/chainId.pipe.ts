import {
  BadRequestException,
  Inject,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ChainIdPipe implements PipeTransform<string, number> {
  constructor(@Inject('CHAINS') private readonly chains: number[]) {}

  transform(value: string): number {
    const chainId = parseInt(value, 10);
    if (isNaN(chainId) || !this.chains.includes(chainId)) {
      throw new BadRequestException('Wrong chain');
    }
    return chainId;
  }
}
