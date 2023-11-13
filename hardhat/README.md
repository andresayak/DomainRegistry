# Domain Registry Project

Try running some of the following tasks:

```shell
npm run test
npm run deploy --network hardhat
```


### Deploy with proxy and upgrade

1) Run deploy script and save output CONTRACT_ADDRESS to .env file
```shell
npx hardhat run --network localhost ./scripts/deploy-proxy.js
```
2) Upgrade 
```shell
npx hardhat run --network localhost ./scripts/deploy-proxy-ugrade.js
```

