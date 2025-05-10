FROM node:22

WORKDIR /app

COPY index.js .
COPY package.json .
COPY vercel.json .
COPY app ./app

RUN npm install

EXPOSE 3000

CMD ["node", "index.js"]
