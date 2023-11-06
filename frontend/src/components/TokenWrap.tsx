import React from "react";
import { Contract } from "ethers";
import { useCalls } from "@usedapp/core";
import ERC20MetadataAbi from "../abi/ERC20MetadataAbi.json";
import { TokenDataType } from "../types/token";

export const TokenWrap = (props: {
  children: (tokenData: TokenDataType) => React.ReactElement
  setErrors?: (errors: any) => void;
  account: string; tokenAddress: string;
  spenderAddress: string
}) => {
  const { spenderAddress, account, children, tokenAddress, setErrors } = props;
  try {
    const contract = new Contract(tokenAddress, ERC20MetadataAbi);
    const result = useCalls([{
      contract,
      method: "balanceOf",
      args: [account],
    }, {
      contract,
      method: "decimals",
      args: [],
    }, {
      contract,
      method: "symbol",
      args: [],
    }, {
      contract,
      method: "allowance",
      args: [account, spenderAddress],
    }, {
      contract,
      method: "name",
      args: [],
    }]) ?? [];
    if (result && result.every((item) => item && !item.error)) {
      const [
        tokenBalanceBN, tokenDecimals, tokenSymbol,
        tokenAllowanceBN, name,
      ] = result.map((item) => item ? item.value[0] : undefined);
      return children({
        address: tokenAddress,
        balance: tokenBalanceBN,
        decimals: tokenDecimals,
        symbol: tokenSymbol,
        allowanceBN: tokenAllowanceBN,
        name,
      });
    }
  } catch (e) {
    console.log("TokenWrap ERROR", e);
    if (setErrors) {
      if (e && e.toString().match(/call revert exception/)) {
        setErrors({ tokenAddress: ["Invalid token address"] });
      }
    }
  }
  return null;
};
