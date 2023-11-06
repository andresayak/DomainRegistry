import { IndexPage } from '../pages/IndexPage';
import { TopPage } from '../pages/TopPage';
import { DomainPage } from '../pages/DomainPage';
import { MyDomainsPage } from '../pages/MyDomainsPage';
import { MyRewardsPage } from '../pages/MyRewardsPage';

export const indexRoutes = {
  path: '/',
  exact: true,
  component: IndexPage,
};

export const topRoutes = {
  path: '/top',
  exact: true,
  component: TopPage,
};

export const domainRoutes = {
  path: '/domain/:domain',
  exact: true,
  component: DomainPage,
};

export const myDomainsRoutes = {
  path: '/my-domains',
  exact: true,
  component: MyDomainsPage,
};

export const myRewardsRoutes = {
  path: '/my-rewards',
  exact: true,
  component: MyRewardsPage,
};


export const page = [
  indexRoutes,
  myDomainsRoutes,
  myRewardsRoutes,
  domainRoutes,
  topRoutes,
];

export default [...page];
