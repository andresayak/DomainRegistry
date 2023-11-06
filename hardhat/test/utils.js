const { expect } = require('chai');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const successReserveDomain = async ({ contract, periods, mainPrice, domain, additionalPrice = 0 }) => {
  expect(await contract.isFreeDomain(domain)).to.true;
  await expect(
    contract.reserveDomain(domain, periods, additionalPrice, {
      value: mainPrice * periods,
    }),
  ).not.to.reverted;
  return {
    domain,
  };
};


module.exports = {
  ZERO_ADDRESS,
  successReserveDomain,
};
