import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { systemMainFetch } from '../store/systemActions';
import { useEthers } from '@usedapp/core';
import { Loader } from './Loader';

const Component = (props: {
  children: React.ReactElement;
  loaded: boolean;
  systemMainFetch: (chainId: number)=>void
}) => {
  const { chainId } = useEthers();

  const { systemMainFetch, loaded } = props;
  useEffect(() => {
    if (chainId) {
      systemMainFetch(chainId);
    }
  }, [chainId, loaded]);
  return <div className='d-flex flex-column h-100'>
    {loaded?props.children:<Loader isShow/>}
  </div>;
};

const Connected = connect((store: any) => ({
  loaded: store.system.loaded,
}), (dispatch: any) => ({
  systemMainFetch: (chainId: number) => systemMainFetch(dispatch, chainId),
}))(Component);

const Wrap = (props: any) => {
  return <Connected {...props} />;
};
export default Wrap;
