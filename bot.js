const util = require('util')
const dotenv = require('dotenv');
const Discord = require("discord.js");
const tools = require('./tools.js')
const LotteryGame = require('./lotterygame.js')


tools.log("Bot initializing...")
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
dotenv.config();
if (process.env.LOTTERY_GAME_TOKEN === undefined)
    unexpectedShutdown("Env variable LOTTERY_GAME_TOKEN not found.");
let TOKEN = process.env.LOTTERY_GAME_TOKEN;
tools.log(util.format("...LOTTERY_GAME_TOKEN=%s...%s", TOKEN.substr(0, 2), TOKEN.substr(-2, 2)));


const discordClient = new Discord.Client();
discordClient.on("ready", handleReady);
discordClient.on("message", handleMessage);
discordClient.login(process.env.LOTTERY_GAME_TOKEN);
const lotteryGame = new LotteryGame(discordClient);


function handleReady() {
    tools.log("on(ready): Bot ready for action !");
}

function handleMessage(message) {
    //tools.log("on(message):");

    if (message.author.bot) {
        //tools.log(util.format("...ignoring message sent by a bot named: %s", message.author.username));
        return;
    }

    if (message.author.id == config.client_id) {
        //tools.log(util.format("...ignoring message sent by my own client id: %s", message.author.id));
        return;
    }

    if (message.channel.type == "text" ) {
        tools.log(util.format("...%s - #%s - %s_%s: %s", message.channel.guild.name, message.channel.name, 
            message.author.username, message.author.discriminator, message.content.split('\n')[0]));
        handleChannelMessage(message);
    } else if (message.channel.type == "dm" ) {
        tools.log(util.format("...DM - DM - %s_%s: %s", 
            message.author.username, message.author.discriminator, message.content.split('\n')[0]));
        handleDirectMessage(message);
    } else {
        tools.log("...unknown channel type: " + message.channel.type);
    }
}

function handleChannelMessage(message) {
    //tools.log("handleChannelMessage...");
    if (message.content.startsWith(lotteryGame.COMMAND_PREFIX)) {
        lotteryGame.handleChannelCommand(message);
    } else {
        //tools.log("...ignoring channel message...");
    }
}

function handleDirectMessage(message) {
    //tools.log("handleDirectMessage..."); 
    if (message.content.startsWith(lotteryGame.COMMAND_PREFIX)) {
        lotteryGame.handleDirectCommand(message);
    } else {
        //tools.log("...ignoring direct message...");
    }
}

function gracefulShutdown() {
    tools.log("gracefulShutdown..."); 
    if (discordClient !== 'undefined') {
        discordClient.destroy();
    }
    process.exit(0);
}

function unexpectedShutdown(message) {
    tools.log("unexpectedShutdown..."); 
    if (discordClient !== 'undefined') {
        discordClient.destroy();
    }
    tools.log(message);
    process.exit(1);
}