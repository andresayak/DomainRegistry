import { FormFeedback, FormGroup, Input, Label } from 'reactstrap';
import React from 'react';

export const DomainResolveForm = ({ values, onChange, errors, isFree }: {
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
      <Input invalid={isError('name') || isFree === true} value={values.name} type='text' name='name'
        valid={isFree === false}
        onChange={(e) => onChange('name', e.currentTarget.value)} />
      {isFree === true && <FormFeedback invalid>
        Domain name is free
      </FormFeedback>}
      {renderErrors('name')}
    </FormGroup>
  </div>;
};
