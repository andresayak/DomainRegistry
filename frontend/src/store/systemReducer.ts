import * as types from './constants';

export type ConfigType = {
  DOMAIN_REGISTRY_ADDRESS: string;
};

const initialState = {
  loaded: false,
  loader: false,
  loader_progress: 0,
  configs: {},
};

export default function reducer(state = initialState, action: any) {
  switch (action.type) {
  case types.SYSTEM_SET_CONFIG:
    return { ...state, loaded: true, configs: action.data };
  default:
    return state;
  }
}
