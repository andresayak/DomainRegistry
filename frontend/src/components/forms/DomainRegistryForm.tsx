import { FormFeedback, FormGroup, Input, Label } from 'reactstrap';
import React from 'react';

export const DomainRegistryForm = ({ values, onChange, errors, isFree }: {
  values: any,
  isFree: null | boolean,
  onChange: (col: string, value: any) => void,
  errors: any
}) => {
  const isError = (col: string): boolean => {
    return errors && typeof errors[col] == 'object' && Object.values(errors[col]).length > 0 ? true : false;
  };
  const renderErrors = (col: string) => {
    // @ts-ignore
    return errors && errors[col] ? Object.values(errors[col]).map((value: string, index: number) => {
      return <FormFeedback key={index}>{value}</FormFeedback>;
    }) : null;
  };

  return <div>
    <FormGroup className='mr-1'>
      <Label>Domain Name</Label>
      <Input invalid={isError('name') || isFree === false} value={values.name} type='text' name='name'
             valid={isFree === true}
             onChange={(e) => onChange('name', e.currentTarget.value)} />
      {isFree === true && <FormFeedback valid>
        Sweet! that name is available
      </FormFeedback>}
      {isFree === false && <FormFeedback>
        Oh noes! that name is already taken
      </FormFeedback>}
      {renderErrors('name')}
    </FormGroup>
    {isFree === true && <FormGroup className='mr-1'>
      <Label>Registration periods (years)</Label>
      <Input invalid={isError('periods')} value={values.periods} type='number' min='1' max='65535'
             name='periods'
             onChange={(e) => onChange('periods', e.currentTarget.value)} />
      {renderErrors('periods')}
    </FormGroup>}
    {isFree === true && <FormGroup className='mr-1'>
      <Label>Addition price for subdomains (USD)</Label>
      <Input invalid={isError('additionalPrice')} value={values.additionalPrice} type='number' min='0'
             name='additionalPrice'
             onChange={(e) => onChange('additionalPrice', e.currentTarget.value)} />
      {renderErrors('additionalPrice')}
    </FormGroup>}
  </div>;
};
