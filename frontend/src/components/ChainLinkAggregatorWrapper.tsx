import { BigNumber, Contract } from 'ethers';
import React from 'react';
import AggregatorAbi from '../abi/AggregatorAbi.json';
import { useCalls } from '@usedapp/core';
import { Loader } from './Loader';

export const ChainLinkAggregatorWrapper = (props: {
  aggregatorAddress: string;
  slippage?: boolean;
  costInUsd: BigNumber;
  children: (price: number, slippage: [number, number], value: BigNumber) => React.ReactElement;
}) => {
  const { slippage: isSlippage = false, costInUsd, aggregatorAddress, children } = props;
  const contract = new Contract(aggregatorAddress, AggregatorAbi);
  const result = useCalls([{
    contract,
    method: 'latestRoundData',
    args: [],
  }, {
    contract,
    method: 'decimals',
    args: [],
  }]);
  if (result && result.every((item) => item && !item.error)) {
    const [
      [, price],
      [decimals],
    ] = result.map((item) => item ? item.value : undefined);
    const rateInUsd = Number(price) / Number(10n ** BigInt(decimals));
    const slippage: [number, number] = [100, 5];
    let value = costInUsd.mul(10n ** BigInt(decimals)).div(price);
    if(isSlippage) {
      value = value.add(value.mul(slippage[1]).div(slippage[0]));
    }
    return <div>
      {children(rateInUsd, slippage, value)}
    </div>;
  }
  return <div className="m-3 text-center">
    <Loader isShow/>
  </div>;
};