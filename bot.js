const util = require('util')
const dotenv = require('dotenv');
const Discord = require("discord.js");
const tools = require('./tools.js')
const LotteryGame = require('./lotterygame.js')


console.log("Bot initializing...")
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

dotenv.config();
let TOKEN = tools.getEnvOrExit('LOTTERY_GAME_TOKEN', obfuscateLog=true);
let ID = tools.getEnvOrExit('LOTTERY_GAME_ID', obfuscateLog=true);

const discordClient = new Discord.Client();
const lotteryGame = new LotteryGame(discordClient);
discordClient.on("ready", handleReady);
discordClient.on("message", handleMessage);
discordClient.login(process.env.LOTTERY_GAME_TOKEN);


function handleReady() {
    console.log("on(ready): Bot ready for action !");
}

function handleMessage(message) {
    //console.log("on(message):");

    if (message.author.bot) {
        //console.log(util.format("...ignoring message sent by a bot named: %s", message.author.username));
        return;
    }

    if (message.author.id == ID) {
        //console.log(util.format("...ignoring message sent by my own client id: %s", message.author.id));
        return;
    }

    if (message.channel.type == "text" ) {
        console.log(util.format("...%s - #%s - %s_%s: %s", message.channel.guild.name, message.channel.name, 
            message.author.username, message.author.discriminator, message.content.split('\n')[0]));
        handleChannelMessage(message);
    } else if (message.channel.type == "dm" ) {
        console.log(util.format("...DM - DM - %s_%s: %s", 
            message.author.username, message.author.discriminator, message.content.split('\n')[0]));
        handleDirectMessage(message);
    } else {
        console.log("...unknown channel type: " + message.channel.type);
    }
}

function handleChannelMessage(message) {
    //console.log("handleChannelMessage...");
    if (message.content.startsWith(lotteryGame.COMMAND_PREFIX)) {
        lotteryGame.handleChannelCommand(message);
    } else {
        //console.log("...ignoring channel message...");
    }
}

function handleDirectMessage(message) {
    //console.log("handleDirectMessage..."); 
    if (message.content.startsWith(lotteryGame.COMMAND_PREFIX)) {
        lotteryGame.handleDirectCommand(message);
    } else {
        //console.log("...ignoring direct message...");
    }
}

function gracefulShutdown() {
    console.log("gracefulShutdown..."); 
    if (typeof discordClient !== 'undefined') {
        discordClient.destroy();
    }
    process.exit(0);
}