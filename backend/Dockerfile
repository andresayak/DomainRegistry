FROM node:21.1.0 as base

RUN apt-get update -y
WORKDIR /var/www/app

COPY package*.json ./
COPY tsconfig*.json ./

EXPOSE 5000

RUN npm install
RUN npm run build

CMD npm run start:dev
