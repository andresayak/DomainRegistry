import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Breadcrumb, BreadcrumbItem, Col, Row } from 'reactstrap';
import { PageTitle } from '../components/PageTitle';
import { toast } from 'react-toastify';
import { Link, useLocation } from 'react-router-dom';
import { useEthers } from '@usedapp/core';
import { Loader } from '../components/Loader';
import { DomainList } from '../components/DomainList';
import { DomainType } from '../types/domain';
import { domainListByOwner } from '../store/systemActions';

function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => {
    return Object.fromEntries(new URLSearchParams(search).entries());
  }, [search]);
}

const Component = () => {
  const { account, chainId } = useEthers();
  const query = useQuery();
  const defaultTab = 'wait';
  const currentTab = query['tab'] ? query['tab'] : defaultTab;
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<DomainType[]>([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    if (chainId && account)
      domainListByOwner(chainId, account).then(response => response.json()).then((response) => {
        console.log('data', response);
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
  console.log('items', chainId, items);
  return <>
    <div className='mt-5 py-5'>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/">
            Home
          </Link>
        </BreadcrumbItem>
        <BreadcrumbItem active>
          My domains
        </BreadcrumbItem>
      </Breadcrumb>
      <div className='d-flex'>
        <div className='flex-fill'>
          <PageTitle title={'My domains'} />
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

export const MyDomainsPage = (props: any) => {
  return <Connected {...props} />;
};
