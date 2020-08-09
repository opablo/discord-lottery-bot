const util = require('util')
const tools = require('./tools')

class LotteryGame {

    COMMAND_PREFIX = "!lottery";
    TIMER_INTERVAL_MS = 10 * 1000; //every 10 seconds
    REMINDER_INVERVAL_MS = 60 * 1000; //every minute
    //REMINDER_INVERVAL_MS = 12 * 60 * 60 * 1000; //twise a day

    constructor(client) {
        this.client = client;
        this.lotteries = new Object();
        setInterval(this.handleTimer, this.TIMER_INTERVAL_MS);
    }

    handleTimer() {
        tools.log("handleTimer...");

        for (let lotteryId in this.lotteries) {
            tools.log("...checking lottery: " + lotteryId);
            let lottery = this.lotteries[lotteryId];
            if (tools.getPossitiveMinsDiff(tools.getCurrentTime(), lottery.endTime) == 0) {
                this.drawLottery(lottery);
            } else if (tools.getPossitiveMinsDiff(tools.getCurrentTime(), lottery.nextReminderTime) == 0) {
                this.remindLottery(lottery);
            }
        }    
    }

    handleCommand(message) {
        tools.log("handleCommand...");

        let input = message.content.substr(this.COMMAND_PREFIX.length).trim();
        let cmd = input.split(' ')[0];
        let args = input.substr(cmd.length).trim().split(/(?:\s*,\s*)/) //split by ',' trimming inner spaces
        tools.log("...cmd = " + cmd);
        tools.log("...args = " + util.inspect(args));
        
        if (cmd == "create") {
            this.handleCreateCommand(message, args);
        } else if (cmd == "join") {
            this.handleJoinCommand(message, args);
        } else if (cmd == 'status') {
            this.handleStatusCommand(message, args);
        } else if (cmd == 'draw') {
            this.handleDrawCommand(message);
        } else if (cmd == 'abort') {
            this.handleAbortCommand(message);
        } else {
            this.handleHelpCommand(message);
        }
    }

    handleHelpCommand(message) {
        tools.log("handleHelpCommand...");

        message.channel.send(tools.trimLines(`
            List of available commands:
            \`\`\`
            !lottery create -- provides instructions for creating a new lottery.
            !lottery join ---- join a given lottery to participate in the draw.
            !lottery status -- show the current status of a given lottery.
            !lottery draw ---- Speed-up your lottery. Only the creator can do it.
            !lottery abort --- Abort your lottery. Only the creator can do it.
            \`\`\``));
    }

    handleCreateCommand(message, args) {
        tools.log("handleCreateCommand...");

        if (args.length != 2 || isNaN(args[0])) {
            message.channel.send(tools.trimLines(`
                The correct syntax for that would be...
                \`\`\`!lottery create [days], [prize name]\`\`\`
                E.g. generating a lottery for **3 Burritos** allowing people **2** days to join would be...
                \`\`\`!lottery create 2, 3 Burritos\`\`\`
                `));
            return;
        }
        
        let days = args[0];
        let prize = args[1];
        let creator = message.author.username + "#" + message.author.discriminator;
        let lotteryId = creator;
        
        let lottery = this.lotteries[lotteryId];
        if (typeof lottery !== 'undefined') {
            message.channel.send(tools.trimLines(util.format(`
                You already have a Lottery set. You can delete it saying:
                \`\`\`!lottery abort %s\`\`\`
                `, lotteryId)));
            return;        
        }

        lottery = new Object();
        lottery.lotteryId = lotteryId;
        lottery.creator = creator;
        lottery.days = days;
        lottery.startTime = tools.getCurrentTime()
        lottery.endTime = tools.getCurrentTime() + days * 60 * 1000 // testing using minutes
        //lottery.endTime = tools.getCurrentTime() + days * 24 * 60 * 60 * 1000
        lottery.nextReminderTime = this.getNewLotteryReminderTime();
        lottery.channelDescription = "#" + message.channel.name + " @ " + message.channel.guild.name;
        lottery.channelId = message.channel.id;
        lottery.prize = prize;
        lottery.participants = [];
        this.lotteries[lotteryId] = lottery;
        
        message.channel.send(tools.trimLines(util.format(`
            **A new Lottery** was created by **%s** where you can win **%s**
            You have **%s** to join saying: 
            \`\`\`!lottery join %s\`\`\`
            `, lottery.creator, lottery.prize, this.getLotteryRemainingTime(lottery), lotteryId)));
    }

    handleJoinCommand(message, args) {
        tools.log("handleJoinCommand...");

        if (args.length != 1 || args[0] == '') {
            message.channel.send(tools.trimLines(`
                The correct syntax for that would be...
                \`\`\`!lottery join [lottery-id]\`\`\`
                `));
            return;
        }

        let lotteryId = args[0];
        let lottery = this.lotteries[lotteryId];
        if (typeof lottery === 'undefined') {
            message.channel.send("No lottery found with id **" + lotteryId + "**");
            return;
        }

        let fullusername = message.author.username + "#" + message.author.discriminator;
        if (lottery.participants.includes(fullusername)) {
            message.channel.send(tools.trimLines(util.format(`
            **%s** ALREADY joined **%s's Lottery** for the prize of **%s** 
            The winner will be announced here in **%s**
            `, fullusername, lottery.creator, lottery.prize, this.getLotteryRemainingTime(lottery))));
            return;
        }
        
        lottery.participants.push(fullusername)
        message.channel.send(tools.trimLines(util.format(`
            **%s** joined **%s's Lottery** for the prize of **%s** 
            The winner will be announced here in **%s**
            `, fullusername, lottery.creator, lottery.prize, this.getLotteryRemainingTime(lottery))));
    }

    handleStatusCommand(message, args) {
        tools.log("handleStatusCommand...");

        if (args.length != 1 || args[0] == '') {
            message.channel.send(tools.trimLines(`
                The correct syntax for that would be...
                \`\`\`!lottery status [lottery-id]\`\`\`
                `));
            return;
        }

        let lotteryId = args[0];
        let lottery = this.lotteries[lotteryId];
        if (typeof lottery === 'undefined') {
            message.channel.send("No lottery found with id **" + lotteryId + "**");
            return;
        }

        message.channel.send(tools.trimLines(util.format(`
            **%s's Lottery** for the prize of **%s** status:
            \`\`\`
            elapsed:    %s
            remaining:  %s
            players:    %s
            \`\`\``, lottery.creator, lottery.prize, this.getLotteryElapsedTime(lottery), 
            this.getLotteryRemainingTime(lottery), util.inspect(lottery.participants))));
    }

    handleDrawCommand(message) {
        tools.log("handleDrawCommand...");

        let lotteryId = message.author.username + "#" + message.author.discriminator;
        let lottery = this.lotteries[lotteryId];
        
        if (typeof lottery === 'undefined') {
            message.channel.send("No lottery found on behalf of **" + lotteryId + "**");
            return;        
        }

        this.drawLottery(lottery);
    }

    handleAbortCommand(message) {
        tools.log("handleAbortCommand...");

        let lotteryId = message.author.username + "#" + message.author.discriminator;
        let lottery = this.lotteries[lotteryId];

        if (typeof lottery === 'undefined') {
            message.channel.send("No lottery found on behalf of **" + lotteryId + "**");
            return;        
        }

        this.abortLottery(lottery);
    }

    ///////////////////////////////////////////////////

    remindLottery(lottery) {
        tools.log("remindLottery..."); 
        
        lottery.nextReminderTime = this.getNewLotteryReminderTime();
        
        let msg = tools.trimLines(util.format(`
            **%s's Lottery** for the prize of **%s** is still running.
            You still have **%s** to join saying:
            \`\`\`!lottery join %s\`\`\`
            `, lottery.creator, lottery.prize, this.getLotteryRemainingTime(lottery), lottery.lotteryId));
        this.client.channels.fetch(lottery.channelId)
            .then(channel => channel.send(msg))
            .catch(console.error);
    }

    drawLottery(lottery) {
        tools.log("drawLottery..."); 

        let winner = tools.randomItemFromArray(lottery.participants);
        let msg = tools.trimLines(util.format(`
            **%s's Lottery** for the prize of **%s** drawing time has come !! :drum:
            .
            And the winner is: **%s** :tada:
            .
            `, lottery.creator, lottery.prize, winner));
        this.client.channels.fetch(lottery.channelId)
            .then(channel => channel.send(msg))
            .catch(console.error);
        
        delete this.lotteries[lottery.lotteryId]
    }

    abortLottery(lottery) {
        tools.log("drawLottery..."); 

        let msg = tools.trimLines(util.format(`
            **%s's Lottery** for the prize of **%s** was borted. :no_entry:
            `, lottery.creator, lottery.prize));
        this.client.channels.fetch(lottery.channelId)
            .then(channel => channel.send(msg))
            .catch(console.error);

        delete this.lotteries[lottery.lotteryId];
    }

    ///////////////////////////////////////////////////

    getLotteryElapsedTime(lottery) {
        return tools.getVerboseTimeDiff(lottery.startTime, tools.getCurrentTime());
    }

    getLotteryRemainingTime(lottery) {
        return tools.getVerboseTimeDiff(tools.getCurrentTime(), lottery.endTime);
    }

    getNewLotteryReminderTime() {
        return tools.getCurrentTime() + this.REMINDER_INVERVAL_MS;
    }
}

module.exports = LotteryGame