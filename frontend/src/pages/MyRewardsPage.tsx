import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Breadcrumb, BreadcrumbItem, Col, Row } from 'reactstrap';
import { PageTitle } from '../components/PageTitle';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useEthers } from '@usedapp/core';
import { Loader } from '../components/Loader';
import { rewardListByOwner } from '../store/systemActions';
import { RewardType } from '../types/reward';
import { RewardList } from '../components/RewardList';

const Component = () => {
  const { account, chainId } = useEthers();
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<RewardType[]>([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    if (chainId && account)
      rewardListByOwner(chainId, account).then(response => response.json()).then((response) => {
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
          <Link to='/'>
            Home
          </Link>
        </BreadcrumbItem>
        <BreadcrumbItem active>
          My rewards
        </BreadcrumbItem>
      </Breadcrumb>
      <div className='d-flex'>
        <div className='flex-fill'>
          <PageTitle title={'My rewards'} />
        </div>
        <div>
          <Loader isShow={loading} />
        </div>
      </div>
      <Row>
        <Col sm={12}>
          <RewardList account={account} chainId={chainId} items={items} />
        </Col>
      </Row>
    </div>
  </>;
};

const Connected = connect((store: any) => ({
  configs: store.system.configs,
}), {})(Component);

export const MyRewardsPage = (props: any) => {
  return <Connected {...props} />;
};
