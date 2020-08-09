FROM node:14.7.0

RUN mkdir -p /opt/discord-lottery-bot
WORKDIR /opt/discord-lottery-bot

COPY . .

RUN npm install

CMD ["node", "bot.js"]