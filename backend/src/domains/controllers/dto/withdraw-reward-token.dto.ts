import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty } from 'class-validator';

export class WithdrawRewardTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEthereumAddress()
  account: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEthereumAddress()
  tokenAddress: string;
}
