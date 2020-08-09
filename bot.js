const util = require('util')
const tools = require('./tools.js')
const config = require("./config.json");
const Discord = require("discord.js");
const LotteryGame = require('./lotterygame.js')

const discordClient = new Discord.Client();
const lotteryGame = new LotteryGame(discordClient);

discordClient.on("ready", handleReady);
discordClient.on("message", handleMessage);
discordClient.login(config.token);

function handleReady() {
    tools.log("on(ready): Bot ready for action !");
}

function handleMessage(message) {
    tools.log("on(message):");

    if (message.author.bot) {
        tools.log(util.format("...ignoring message sent by a bot named: %s", message.author.username));
        return;
    }

    if (message.author.id == config.client_id) {
        tools.log(util.format("...ignoring message sent by my own client id: %s", message.author.id));
        return;
    }

    if (message.channel.type == "text" ) {
        tools.log(util.format("...Server: %s / Channel: #%s / Author: %s#%s (%s)", message.channel.guild.name, message.channel.name, message.author.username, message.author.discriminator, message.author.id));
        tools.log(util.format("...Message content 1st line: %s", message.content.split('\n')[0]));
        handleChannelMessage(message);
    } else if (message.channel.type == "dm" ) {
        tools.log(util.format("...Server: DM / Channel: DM / Author: %s@%s (%s)", message.author.username, message.author.discriminator, message.author.id));
        tools.log(util.format("...Message content 1st line: %s", message.content.split('\n')[0]));
        handleDirectMessage(message);
    } else {
        tools.log("...unknown channel type: " + message.channel.type);
    }
}

function handleChannelMessage(message) {
    tools.log("handleChannelMessage..."); 
    if (message.content.startsWith(lotteryGame.COMMAND_PREFIX)) {
        lotteryGame.handleCommand(message);
    } else {
        tools.log("...ignoring channel message...");
    }
}

function handleDirectMessage(message) {
    tools.log("handleDirectMessage..."); 
    tools.log("...ignoring direct message...");
}