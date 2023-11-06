import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Breadcrumb, BreadcrumbItem, Col, Row } from 'reactstrap';
import { PageTitle } from '../components/PageTitle';
import { toast } from 'react-toastify';
import { Link, useParams } from 'react-router-dom';
import { useEthers } from '@usedapp/core';
import { Loader } from '../components/Loader';
import { DomainList } from '../components/DomainList';
import { DomainType } from '../types/domain';
import { subdomainList } from '../store/systemActions';
import { Page404 } from './errors/Page404';
import { topRoutes } from '../routes';

const getParentDomainName = (domain: string) => {
  const match = domain.match(/^[^\.]+\.(.+)$/);
  return match ? match[1] : null;
};

const Component = () => {
  const { domain } = useParams();
  const { account, chainId } = useEthers();
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<DomainType[]>([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    if (chainId && domain)
      subdomainList(chainId, domain).then(response => response.json()).then((response) => {
        setItems(response);
      }).catch((reason) => {
        toast.error(reason.message);
      }).finally(() => setLoading(false));
  }, [domain, chainId]);
  useEffect(() => {
    if (chainId) {
      fetchData();
    }
  }, [
    domain,
    chainId,
  ]);
  if (!domain) {
    return <Page404 />;
  }
  if (!chainId || !account) {
    return <></>;
  }
  const path = (domain: string) => {
    const list = [];
    const parent = getParentDomainName(domain);
    if (parent) {
      list.push(parent);
    }
    return list;
  };
  console.log('path', path(domain));
  return <>
    <div className='mt-5 py-5'>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to='/'>
            Home
          </Link>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Link to={topRoutes.path}>
            TOP domains
          </Link>
        </BreadcrumbItem>
        {path(domain).map((item, index) => <BreadcrumbItem key={index}>
          <Link to={'/domain/' + item}>
            {item}
          </Link>
        </BreadcrumbItem>)}
        <BreadcrumbItem active>
          {domain}
        </BreadcrumbItem>
      </Breadcrumb>
      <div className='d-flex'>
        <div className='flex-fill'>
          <PageTitle title={domain} />
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

export const DomainPage = (props: any) => {
  return <Connected {...props} />;
};
