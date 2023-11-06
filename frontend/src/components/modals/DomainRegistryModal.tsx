import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink } from 'reactstrap';
import { BigNumber, Contract } from 'ethers';
import { TokenItemType, TokenList } from '../TokenList';
import { DomainRegistryForm } from '../forms/DomainRegistryForm';
import DomainRegistryAbi from '../../abi/DomainRegistryAbi.json';
import { useEthers } from '@usedapp/core';
import { ethers } from 'ethers/lib.esm';
import { DomainRegistryWithEthButton } from '../buttons/DomainRegistryWithEthButton';
import { ChainLinkAggregatorWrapper } from '../ChainLinkAggregatorWrapper';
import { ApproveToken } from '../buttons/ApproveToken';
import { TokenDataType } from '../../types/token';
import { TokenWrap } from '../TokenWrap';
import { DomainRegistryWithTokenButton } from '../buttons/DomainRegistryWithTokenButton';

type PropType = {
  account: string;
  chainId: number;
  children: (onClick: () => void) => React.ReactElement;
  contractAddress: string;
}

const getParentDomainName = (domain: string) => {
  const match = domain.match(/^[^\.]+\.(.+)$/);
  return match ? match[1] : null;
};



export function DomainRegistryModal(props: PropType) {
  const { library } = useEthers();
  const { account, children, chainId, contractAddress } = props;
  const [modal, setModal] = useState(false);
  const [token, setPaymentToken] = useState<TokenItemType>()
  const [paymentMethod, setPaymentMethod] = useState('NATIVE');
  const [mainPrice, setMainPrice] = useState<BigNumber>(BigNumber.from(0));
  const [currentPrice, setCurrentPrice] = useState<BigNumber>(BigNumber.from(0));
  const [isFree, setFree] = useState<null | boolean>(null);
  const [step, setStep] = useState<number>(1);
  const [baseAggregator, setBaseAggregator] = useState<string>('');
  const [allowanceBN, setAllowance] = useState<BigNumber>(BigNumber.from(0));
  const [errors, setErrors] = useState<any>({});
  const defaultValues = {
    name: '',
    tokenAddress: '',
    periods: '1',
    additionalPrice: '0',
  };
  const contract = new Contract(contractAddress, DomainRegistryAbi, library);
  const [values, setValues] = useState<any>(defaultValues);
  const intervalRef = useRef<ReturnType<typeof setTimeout>>();
  const handleCheckAvailability = useCallback((name: string) => {
    clearInterval(intervalRef.current);
    setFree(null);
    setCurrentPrice(BigNumber.from(0));
    if (name) {
      intervalRef.current = setTimeout(async () => {
        const parent = getParentDomainName(name);
        const resultFree = await contract.isFreeDomain(name);
        if (resultFree) {
          if (parent) {
            const resultParentFree = await contract.isFreeDomain(parent);
            if (resultParentFree) {
              return setFree(false);
            }
            const parentPrice = await contract.domainPrice(parent);
            setCurrentPrice(parentPrice);
          } else {
            setCurrentPrice(mainPrice);
          }
          return setFree(true);
        }
        return setFree(false);
      }, 500);
    } else {
      setFree(null);
    }
  }, [mainPrice, intervalRef]);

  useEffect(() => {
    contract.mainPrice().then((result: BigNumber) => {
      setMainPrice(result);
    });
    contract.baseAggregator().then((result: string) => {
      setBaseAggregator(result);
    });

  }, [
    contractAddress,
    library,
  ]);
  const onChange = (col: string, value: string) => {
    setValues({ ...values, [col]: value });
    setErrors({ ...errors, [col]: undefined });
    if (col == 'name') {
      handleCheckAvailability(value);
    }
  };
  const toggle = () => {
    setModal(!modal);
    if (modal) {
      setValues(defaultValues);
    }
  };

  const finaleCostInUsd = currentPrice.mul(values.periods);
  const additionalPriceBN = ethers.utils.parseEther(values.additionalPrice);
  return (
    <>
      {children(toggle)}
      <Modal isOpen={modal} toggle={toggle}>
        {step == 1 ? <>
          <ModalHeader>
            Registration a domain (step 1)
          </ModalHeader>
          <ModalBody>
            <DomainRegistryForm isFree={isFree} onChange={onChange} values={values} errors={errors} />
            {isFree && <div className='d-flex'>
              <div className='flex-fill'>
                Price: <b>{ethers.utils.formatEther(finaleCostInUsd)} USD</b>
              </div>
            </div>}
          </ModalBody>
          <ModalFooter>
            <Button
              color='primary' size={'lg'} block className='mr-1'
              disabled={!isFree} onClick={() => setStep(2)}>
              Pay
            </Button>
          </ModalFooter>
        </> : null}
        {step == 2 ? <>
          <ModalHeader>
            Registration a domain (step 2)
          </ModalHeader>
          <div className='border-bottom p-3 mb-3'>
            <div className='d-flex'>
              <div className='flex-fill'>
                <div>Domain: <b>{values.name}</b></div>
                <div>Periods: <b>{values.periods}</b> (years)</div>
                <div>Addition price for subdomains (USD): <b>{ethers.utils.formatEther(additionalPriceBN)} USD</b></div>
                <div className='h5'>Price: <b>{ethers.utils.formatEther(finaleCostInUsd)} USD</b></div>
              </div>
              <div>
                <a className='small' onClick={() => {
                  setStep(1);
                  setPaymentMethod('NATIVE');
                  setPaymentToken(undefined);
                }}>Edit</a>
              </div>
            </div>
          </div>
          <Nav tabs>
            <NavItem>
              <NavLink href='#' active={paymentMethod == 'NATIVE'} onClick={() => setPaymentMethod('NATIVE')}>
                Payment in ETH
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink href='#' active={paymentMethod == 'ERC20'} onClick={() => setPaymentMethod('ERC20')}>
                Payment in ERC20 token
              </NavLink>
            </NavItem>
          </Nav>
          {paymentMethod == 'ERC20' && <>
              {!token ? <TokenList
                account={account} chainId={chainId}
                selectToken={(token) => setPaymentToken(token)}
                spenderAddress={contractAddress} /> : <div>
                <ChainLinkAggregatorWrapper aggregatorAddress={token.feedAddress} costInUsd={finaleCostInUsd} children={(price, _, value) => <>

                    {!!token && <>
                      <TokenWrap
                        tokenAddress={token.address} account={account} setErrors={setErrors}
                        spenderAddress={contractAddress} children={(tokenData: TokenDataType) => {
                        const currentAllowanceBN = !tokenData || allowanceBN.gt(tokenData.allowanceBN) ? allowanceBN : tokenData.allowanceBN;
                        return <>
                          <ModalBody>
                            <div className='d-flex'>
                              <div className='flex-fill'>
                                <div>Token: <b>{token.symbol}</b></div>
                                <div>Balance: <b>{ethers.utils.formatUnits(tokenData.balance, tokenData.decimals)} {token.symbol}</b></div>
                                <div>Exchange rate: <b>{price.toFixed(2)} USD</b></div>
                                <div>Cost in Token: <b>{ethers.utils.formatEther(value)} {token.symbol}</b></div>
                              </div>
                              <div>
                                <a className='small' onClick={() => setPaymentToken(undefined)}>Edit</a>
                              </div>
                            </div>
                          </ModalBody>
                          <ModalFooter>
                            <ApproveToken
                              allowanceBN={currentAllowanceBN}
                              tokenAddress={token.address}
                              spenderAddress={contractAddress}
                              amountBN={value}
                              callback={(value) => setAllowance(value)} />
                            <DomainRegistryWithTokenButton
                              disabled={currentAllowanceBN.lt(value)}
                              token={token}
                              amount={value}
                              contractAddress={contractAddress}
                              callback={toggle}
                              values={values} />
                          </ModalFooter>
                        </>}}/>
                    </>}
                </>}/>
              </div>}
          </>}
          {paymentMethod == 'NATIVE' &&
            <ChainLinkAggregatorWrapper aggregatorAddress={baseAggregator} slippage costInUsd={finaleCostInUsd} children={(price, slippage, value) => <>
              <ModalBody>
                <div className='d-flex'>
                  <div className='flex-fill'>
                    <div>Exchange rate: <b>{price.toFixed(2)} USD</b></div>
                    <div>Cost in ETH: <b>{ethers.utils.formatEther(value)} ETH</b></div>
                    <div>Slippage: <b>{Number(slippage[1]/slippage[0]).toFixed(2)}%</b></div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <DomainRegistryWithEthButton value={value} values={values} contractAddress={contractAddress} callback={() => {
                  toggle();
                }} disabled={false} />
              </ModalFooter>
            </>} />}
        </> : null}
      </Modal>
    </>
  );
}
