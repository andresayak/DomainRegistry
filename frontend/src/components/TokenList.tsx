import React, { useCallback, useEffect, useState } from 'react';
import { tokenList } from '../store/systemActions';

export type TokenItemType = {
  chainId?: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance?: string;
  feedAddress: string;
}

type PropType = {
  account: string;
  chainId: number;
  spenderAddress: string;
  selectToken: (token: TokenItemType) => void
};

export const RenderTokenItem = ({ token, selectToken }: {
  token: TokenItemType,
  selectToken: (token: TokenItemType) => void
}) => {
  return <div className='tokenList-item pt-1 pb-2' onClick={() => selectToken(token)}>
    <div className='px-3'>
      <div className='d-flex'>
        <div className='flex-fill px-4'>
          <div className='h4 mb-0'>{token.name}</div>
          <div>{token.symbol}</div>
        </div>
      </div>
    </div>
  </div>;
};

export const TokenList = (props: PropType) => {
  const { chainId, selectToken } = props;

  const [items, setItems] = useState<TokenItemType[]>([]);

  const selectTokenAndSaveToRecent = (token: TokenItemType) => {
    if (chainId) {
      selectToken(token);
    }
  };
  const fetchData = useCallback(() => {
    if (chainId) {
      tokenList(chainId).then(response => response.json()).then((response) => {
        setItems(response);
      });
    }
  }, [chainId]);
  useEffect(() => {
    fetchData();
  }, [chainId]);

  if (!chainId) {
    return null;
  }
  return <>
      <div className='tokenList my-2'>
        {items.map((token, index) => {
          return <React.Fragment key={index}>
            <RenderTokenItem selectToken={selectTokenAndSaveToRecent} token={token} />
          </React.Fragment>;
        })}
      </div>
  </>;
};
