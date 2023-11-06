import React from 'react';
import { Helmet } from 'react-helmet';

interface IProps {
  title: string;
}

export const PageTitle = ({ title }: IProps) => (
  <div className='mb-4 px-2'>
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <h3>{title}</h3>
    </div>
  </div>
);
