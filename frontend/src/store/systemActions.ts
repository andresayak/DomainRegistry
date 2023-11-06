import * as types from './constants';
import { Dispatch } from 'redux';

const prefix = 'http://localhost:5000/api/';
export const systemMainFetch = (dispatch: Dispatch, chainId: number) => {
  return fetch(prefix + 'system/main/' + chainId).then(response => response.json()).then(response => {
    dispatch({
      type: types.SYSTEM_SET_CONFIG,
      data: response,
    });
    return response;
  });
};

export const subdomainList = (chainId: number, domain: string) => {
  return fetch(prefix + 'domains/' + chainId + '/' + domain + '/children');
};

export const tokenList = (chainId: number) => {
  return fetch(prefix + 'tokens/' + chainId);
};

export const domainList = (chainId: number) => {
  return fetch(prefix + 'domains/' + chainId);
};

export const rewardListByOwner = (chainId: number, account: string) => {
  return fetch(prefix + 'rewards/' + chainId + '/byAccount/' + account);
};

export const domainListByOwner = (chainId: number, owner: string) => {
  return fetch(prefix + 'domains/' + chainId + '/byOwner/' + owner);
};

export const domainInfo = (chainId: number, domain: string) => {
  return fetch(prefix + 'domains/' + chainId + '/' + domain);
};