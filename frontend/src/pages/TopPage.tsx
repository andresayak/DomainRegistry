import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Breadcrumb, BreadcrumbItem, Col, Row } from 'reactstrap';
import { PageTitle } from '../components/PageTitle';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useEthers } from '@usedapp/core';
import { Loader } from '../components/Loader';
import { DomainList } from '../components/DomainList';
import { DomainType } from '../types/domain';
import { domainList } from '../store/systemActions';

const Component = () => {
  const { account, chainId } = useEthers();
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<DomainType[]>([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    if (chainId)
      domainList(chainId).then(response => response.json()).then((response) => {
        setItems(response);
      }).catch((reason) => {
        toast.error(reason.message);
      }).finally(() => setLoading(false));
  }, [chainId]);
  useEffect(() => {
    if (chainId) {
      fetchData();
    }
  }, [
    chainId,
  ]);
  if (!chainId || !account) {
    return <></>;
  }
  return <>
    <div className='mt-5 py-5'>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/">
            Home
          </Link>
        </BreadcrumbItem>
        <BreadcrumbItem active>
          TOP domains
        </BreadcrumbItem>
      </Breadcrumb>
      <div className='d-flex'>
        <div className='flex-fill'>
          <PageTitle title={'TOP domains'} />
        </div>
        <div>
          <Loader isShow={loading} />
        </div>
      </div>
      <Row>
        <Col sm={12}>
          <DomainList account={account} chainId={chainId} items={items} />
        </Col>
      </Row>
    </div>
  </>;
};

const Connected = connect((store: any) => ({
  configs: store.system.configs,
}), {})(Component);

export const TopPage = (props: any) => {
  return <Connected {...props} />;
};
