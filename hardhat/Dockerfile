FROM node:21.1.0 as base

RUN apt-get update
WORKDIR /var/www/app

COPY package*.json ./

EXPOSE 8545

RUN npm install;

CMD npx hardhat node --hostname 0.0.0.0
