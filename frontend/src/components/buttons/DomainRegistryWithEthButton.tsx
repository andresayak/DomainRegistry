import {useContractFunction, useEthers} from '@usedapp/core';
import React, {useCallback, useMemo, useState} from 'react';
import {BigNumber, Contract} from 'ethers';
import DomainRegistryAbi from '../../abi/DomainRegistryAbi.json';
import {toast} from 'react-toastify';
import {Button} from 'reactstrap';
import {ethers} from 'ethers/lib.esm';

export const DomainRegistryWithEthButton = (props: {
    contractAddress: string;
    additionalPriceBN: BigNumber;
    callback: (event?: ethers.utils.LogDescription) => void;
    disabled: boolean;
    values: any;
    value: BigNumber
}) => {
  const {callback, contractAddress, disabled, values, value, additionalPriceBN} = props;
  const {library} = useEthers();
  const contract = new Contract(contractAddress, DomainRegistryAbi);
  const {state, send, events} = useContractFunction(contract, 'reserveDomain');
  const [attems, setAttems] = useState<number>(0);

  useMemo(() => {
    if (state.status == 'Exception')
      if (state.errorMessage)
        toast.error(state.errorMessage);
    if (state.status == 'Success' && events?.length) {
      toast.success('Domain Registered! ');
      console.log('state', state);
      console.log('events', events);
      callback();
    }
  }, [state.status, attems, events]);

  const create = useCallback(
    async () => {
      setAttems(attems + 1);
      console.log('send', {
        name: values.name,
        periods: values.periods.toString(),
        additionalPrice: additionalPriceBN.toString(),
        value: value.toString()
      });
      await send(values.name, values.periods.toString(), additionalPriceBN.toString(), {
        value: value.toString(),
      });
    },
    [library, value, state.status, attems, events],
  );

  if (state.status == 'Success') {
    return <Button color='primary' size={'lg'} block className='mr-1' disabled={true}>Finished</Button>;
  }

  return <Button
    color='primary' size={'lg'} block className='mr-1'
    disabled={state.status == 'Mining' || disabled} onClick={create}>
    {state.status == 'Mining' ? 'Mining...' : 'Pay ' + ethers.utils.formatEther(value) + ' ETH'}
  </Button>;
};
