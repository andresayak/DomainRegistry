import React, { useCallback, useRef, useState } from 'react';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { Contract } from 'ethers';
import DomainRegistryAbi from '../../abi/DomainRegistryAbi.json';
import { useEthers } from '@usedapp/core';
import { DomainResolveForm } from '../forms/DomainResolveForm';

type PropType = {
  account: string;
  chainId: number;
  children: (onClick: () => void) => React.ReactElement;
  contractAddress: string;
}

export function DomainResolveModal(props: PropType) {
  const { library } = useEthers();
  const {contractAddress, children} = props;
  const [modal, setModal] = useState(false);
  const [owner, setOwner] = useState<string>('');
  const [isFree, setFree] = useState<null | boolean>(null);
  const [errors, setErrors] = useState<any>({});
  const defaultValues = {
    name: '',
    tokenAddress: '',
    periods: '1',
    additionalPrice: '0'
  };
  const contract = new Contract(contractAddress, DomainRegistryAbi, library);
  const [values, setValues] = useState<any>(defaultValues);
  const intervalRef = useRef<ReturnType<typeof setTimeout>>();
  const handleCheckAvailability = useCallback((name: string) => {
    clearInterval(intervalRef.current);
    setFree(null);
    setOwner('');
    if (name) {
      intervalRef.current = setTimeout(async () => {
        const resultFree = await contract.isFreeDomain(name);
        if (!resultFree) {
          const result = await contract.domainInfo(name);
          setOwner(result?result.owner:'');
        }
        return setFree(resultFree);
      }, 500);
    } else {
      setFree(null);
    }
  }, [intervalRef]);

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

  return (
    <>
      {children(toggle)}
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader>
          Domain resolver
        </ModalHeader>
        <ModalBody>
          <DomainResolveForm isFree={isFree} onChange={onChange} values={values} errors={errors} />
          {owner && <div className="d-flex">
            <div className="flex-fill">
              Owner: <b>{owner}</b>
            </div>
          </div>}
        </ModalBody>
      </Modal>
    </>
  );
}
