FROM node:22.11.0

WORKDIR /backend

COPY package*.json .

RUN npm i

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]