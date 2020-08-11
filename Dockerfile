FROM node:14.7.0

RUN mkdir -p /opt/discord-lottery-bot
WORKDIR /opt/discord-lottery-bot

COPY package*.json ./
RUN npm install

COPY . ./

CMD ["node", "bot.js"]