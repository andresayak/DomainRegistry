import { useContractFunction, useEthers } from '@usedapp/core';
import React, { useCallback, useMemo, useState } from 'react';
import { BigNumber, Contract } from 'ethers';
import DomainRegistryAbi from '../../abi/DomainRegistryAbi.json';
import { toast } from 'react-toastify';
import { Button } from 'reactstrap';
import { ethers } from 'ethers/lib.esm';
import { TokenItemType } from '../TokenList';

export const DomainRegistryWithTokenButton = (props: {
  contractAddress: string,
  callback: () => void;
  disabled: boolean,
  amount: BigNumber;
  token: TokenItemType;
  values: any
}) => {

  const { callback, contractAddress, disabled, values, amount, token } = props;
  console.log('contractAddress', contractAddress);
  const { library } = useEthers();
  const contract = new Contract(contractAddress, DomainRegistryAbi);
  const { state, send, events } = useContractFunction(contract, 'reserveDomainByToken');

  useMemo(() => {
    if (state.status == 'Exception')
      if (state.errorMessage)
        toast.error(state.errorMessage);
    if (state.status == 'Success' && events) {
      toast.success('Domain Registered! ');
      callback();
    }
  }, [state.status, events]);

  const create = useCallback(
    async (...args: any[]) => {
      console.log('send', {
        name: values.name,
        tokenAddress: token.address,
        periods: values.periods.toString(),
        additionalPrice: values.additionalPrice.toString()});
      await send(
        values.name, values.periods, token.address, values.additionalPrice,
      );
    },
    [library, values, state.status, events],
  );

  if (state.status == 'Success') {
    return <Button color='primary' size={'lg'} block className='mr-1' disabled={true}>Finished</Button>;
  }

  return <Button
    color='primary' size={'lg'} block className='mr-1'
    disabled={state.status == 'Mining' || disabled} onClick={create}>
    {state.status == 'Mining' ? 'Mining...' : 'Pay ' + ethers.utils.formatEther(amount) + ' ' + token.symbol}
  </Button>;
};
