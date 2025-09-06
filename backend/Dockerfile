FROM node:22.16-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 7878

RUN apk add --no-cache bash

RUN chmod +x wait-for-it.sh




