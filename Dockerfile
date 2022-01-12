FROM 17-alpine

WORKDIR /usr/src/app

COPY package*.json .env ./

RUN npm ci

COPY . .

RUN npm run build

CMD [ "npm", "start" ]
