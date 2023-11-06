import { Table } from 'reactstrap';
import React from 'react';
import { RewardType } from '../types/reward';

type PropType = {
  items: RewardType[];
  account: string;
  chainId: number;
}

export const RewardList = (props: PropType) => {
  const { items } = props;
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
          {item.tokenAddress}
        </td>
        <td>
          {item.balance}
        </td>
        <td className='text-end'>
        </td>
      </tr>;
    })}
    </tbody>
  </Table>;
};
