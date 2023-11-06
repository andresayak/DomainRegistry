import React from 'react';
import { connect } from 'react-redux';
import { Button, Col, Row } from 'reactstrap';
import { useEthers } from '@usedapp/core';
import { DomainRegistryModal } from '../components/modals/DomainRegistryModal';
import { ConfigType } from '../store/systemReducer';

const Component = ({configs}: {
  configs: ConfigType
}) => {
  const { account, chainId } = useEthers();
  if (!account || !chainId) {
    return null;
  }
  return <div className='mt-5 py-5'>
    <Row>
      <Col sm={6}>
        <div className='card-deck mb-3 text-center'>
          <div className='card mb-4 box-shadow'>
            <div className='card-header'>
              <h4 className='my-0 font-weight-normal'>Domain registrations</h4>
            </div>
            <div className='card-body'>
              <DomainRegistryModal
                account={account} chainId={chainId}
                contractAddress={configs['DOMAIN_REGISTRY_ADDRESS']}
                children={(toggle) => <Button onClick={toggle} color='primary' size="lg">Register</Button>} />
            </div>
          </div>
        </div>
      </Col>
    </Row>
  </div>;
};

const Connected = connect((store: any) => ({
  configs: store.system.configs,
}), {})(Component);

export const IndexPage = (props: any) => {
  return <Connected {...props} />;
};
