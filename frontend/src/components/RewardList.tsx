import { Button, Table } from 'reactstrap';
import React from 'react';
import { RewardType } from '../types/reward';
import { ethers } from 'ethers/lib.esm';

type PropType = {
  items: RewardType[];
  getReward: (tokenAddress: string) => void;
  account: string;
  chainId: number;
}

export const RewardList = (props: PropType) => {
  const { items,  getReward} = props;
  return <Table>
    <thead>
      <tr>
        <th>Token</th>
        <th>Balance</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {items.map((item, index) => {
        return <tr key={index}>
          <td>
            {item.tokenAddress??'ETH'}
          </td>
          <td>
            {ethers.utils.formatEther(item.balance)}
          </td>
          <td className='text-end'>
            <Button color="primary" onClick={()=>getReward(item.tokenAddress)}>Get a reward</Button>
          </td>
        </tr>;
      })}
    </tbody>
  </Table>;
};
