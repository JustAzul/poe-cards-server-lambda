FROM node:16-alpine AS BUILD_IMAGE

WORKDIR /usr/src/app

COPY package*.json ./
COPY . .

RUN npm install --production
RUN npm prune --production

CMD [ "node", "index.js" ]