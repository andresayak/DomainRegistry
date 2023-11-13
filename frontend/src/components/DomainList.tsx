import { Button, Table } from 'reactstrap';
import Moment from 'react-moment';
import { Link } from 'react-router-dom';
import { shortenAddress } from '@usedapp/core';
import React from 'react';
import { DomainType } from '../types/domain';
import {ethers} from 'ethers';

type PropType = {
  items: DomainType[];
  account: string;
  chainId: number;
}

export const DomainList = (props: PropType) => {
  const { items } = props;
  return <Table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Owner</th>
        <th>Additional price</th>
        <th>Created At</th>
        <th>Finished At</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {items.map((item, index) => {
        return <tr key={index}>
          <td>
            {item.name}
          </td>
          <td>
            <span title={item.owner}>{shortenAddress(item.owner)}</span>
          </td>
          <td>
            {ethers.utils.formatEther(item.additionalPrice)} USD
          </td>
          <td>
            <Moment date={item.createdAt} fromNow />
            <div className='small'>
              <Moment date={item.createdAt} />
            </div>
          </td>
          <td>
            <Moment date={item.finishedAt} fromNow />
            <div className='small'>
              <Moment date={item.finishedAt} />
            </div>
          </td>
          <td className='text-end'>
            <Button tag={Link} to={'/domain/' + item.name} color='light' className='me-2'>View</Button>
          </td>
        </tr>;
      })}
    </tbody>
  </Table>;
};
