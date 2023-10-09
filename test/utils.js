const { expect } = require('chai');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const successReserveDomain = async ({ contract, periods, mainPrice, domain }) => {
  expect(await contract.isFreeDomain(domain)).to.be.true;

  await expect(
    contract.reserveDomain(domain, periods, {
      value: mainPrice,
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
