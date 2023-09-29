const { expect } = require('chai');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const successReserveDomain = async ({ contract, lockAmount, domain }) => {
  expect(await contract.checkIsFreeDomain(domain)).to.be.true;

  await expect(
    contract.reserveDomain(domain, {
      value: lockAmount,
    }),
  ).not.to.be.reverted;
  return {
    domain,
  };
};

module.exports = {
  ZERO_ADDRESS,
  successReserveDomain
};
