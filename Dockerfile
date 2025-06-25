FROM node:18

WORKDIR /app/chat-gateway-service

COPY chat-gateway-service/package.json ./

RUN npm install

COPY chat-gateway-service/ ./

EXPOSE 3000

CMD [ "npm","run","start:dev" ]