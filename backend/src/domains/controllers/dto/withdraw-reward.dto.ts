import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty } from 'class-validator';

export class WithdrawRewardDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEthereumAddress()
  account: string;
}
