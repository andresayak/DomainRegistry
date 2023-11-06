import React from 'react';
import {
  Nav,
  Navbar,
  NavbarBrand,
  NavItem,
  NavLink,
  Badge,
} from 'reactstrap';
import { matchPath } from 'react-router-dom';

import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { topRoutes, myDomainsRoutes, myRewardsRoutes } from '../routes';
import { useEthers, shortenAddress } from '@usedapp/core';
import { ConnectButton } from './modals/ConnectButton';

export default () => {
  const location = useLocation();

  const items = [{
    label: 'TOP domains',
    url: topRoutes.path,
    match: () => {
      return !!matchPath(topRoutes.path, location.pathname);
    },
  }, {
    label: 'My domains',
    url: myDomainsRoutes.path,
    match: () => {
      return !!matchPath(myDomainsRoutes.path, location.pathname);
    },
  }, {
    label: 'My rewards',
    url: myRewardsRoutes.path,
    match: () => {
      return !!matchPath(myRewardsRoutes.path, location.pathname);
    },
  }];
  const { account } = useEthers();
  return <div className='border-bottom'>
    <Navbar
      color='white'
      container
      expand='md'
      light
    >
      <NavbarBrand tag={Link} to='/'>
        Home
      </NavbarBrand>
      <Nav className='mr-auto order-sm-last w-sm-100' navbar>
        {account && (
          <NavItem>
            <Badge
              className='text-dark p-2 m-1'
              color='light'
            >
              {shortenAddress(account)}
            </Badge>
          </NavItem>
        )}
        <NavItem>
          <ConnectButton />
        </NavItem>
      </Nav>
      <Nav className='me-auto' navbar>
        {items.map((item, key) => {
          const active = item.match();
          return <NavItem key={key}>
            <NavLink tag={Link} active={active} to={item.url}>
              {item.label}
            </NavLink>
          </NavItem>;
        })}
      </Nav>
    </Navbar>
  </div>;
}
