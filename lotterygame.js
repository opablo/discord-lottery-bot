const util = require('util')
const tools = require('./tools')

class LotteryGame {

    COMMAND_PREFIX = "!lottery";

    constructor(client) {
        this.TIMER_INTERVAL_MS = 1000 * tools.getEnvOrExit('TIMER_INTERVAL_SECS');
        this.REMINDER_INVERVAL_MS = 1000 * tools.getEnvOrExit('REMINDER_INVERVAL_SECS');
        this.DRAW_DAYS_INVERVAL_MS = 1000 * tools.getEnvOrExit('DRAW_DAYS_INVERVAL_SECS');
        this.client = client;
        this.lotteries = new Object();
        setInterval(x => this.handleTimer(), this.TIMER_INTERVAL_MS);
    }

    handleTimer() {
        //console.log("handleTimer...");
        //console.log("... " + util.inspect(this.lotteries));
        for (let lotteryId in this.lotteries) {
            let lottery = this.lotteries[lotteryId];
            if (tools.getPossitiveMinsDiff(tools.getCurrentTime(), lottery.endTime) == 0) {
                this.drawLottery(lottery);
            } else if (tools.getPossitiveMinsDiff(tools.getCurrentTime(), lottery.nextReminderTime) == 0) {
                this.remindLottery(lottery);
            }
        }    
    }

    handleChannelCommand(message) {
        //console.log("handleChannelCommand...");

        let input = this.parseCmdAndArgs(message);        
        if (input.cmd == "create") {
            this.handleCreateCommand(message, input.args);
        } else if (input.cmd == "join") {
            this.handleJoinCommand(message, input.args);
        } else if (input.cmd == 'status') {
            this.handleStatusCommand(message, input.args);
        } else if (input.cmd == 'remind') {
            this.handleRemindCommand(message);
        } else if (input.cmd == 'draw') {
            this.handleDrawCommand(message);
        } else if (input.cmd == 'abort') {
            this.handleAbortCommand(message);
        } else {
            this.handleHelpCommand(message);
        }
    }

    handleDirectCommand(message) {
        //console.log("handleDirectCommand...");

        let input = this.parseCmdAndArgs(message);        
        if (input.cmd == 'fullstatus666') {
            this.handleFullStatus666Command(message);
        }
    }

    handleHelpCommand(message) {
        //console.log("handleHelpCommand...");

        message.channel.send(tools.trimEachLine(`
            List of available commands:
            \`\`\`
            !lottery create -- provides instructions for creating a new lottery.
            !lottery join ---- join a given lottery to participate in the draw.
            !lottery status -- show the current status of a given lottery.
            !lottery remind -- Speed-up your lottery reminder msg. Only for the creator.
            !lottery draw ---- Speed-up your lottery draw. Only the creator can do it.
            !lottery abort --- Abort your lottery. Only the creator can do it.
            \`\`\``));
    }

    handleCreateCommand(message, args) {
        //console.log("handleCreateCommand...");

        if (args.length != 2 || isNaN(args[0])) {
            message.channel.send(tools.trimEachLine(`
                The correct syntax for that would be...
                \`\`\`!lottery create [days], [prize name]\`\`\`
                E.g. generating a lottery for **3 Burritos** allowing people **2** days to join would be...
                \`\`\`!lottery create 2, 3 Burritos\`\`\`
                `));
            return;
        }
        
        let days = args[0];
        let prize = args[1];
        
        let lotteryId = tools.zipInt(message.author.id);
        let lottery = this.lotteries[lotteryId];
        if (typeof lottery !== 'undefined') {
            message.channel.send(tools.trimEachLine(util.format(`
                You already have a Lottery set. You can delete it saying:
                \`\`\`!lottery abort\`\`\`
                Or check it's status saying:
                \`\`\`!lottery status %s\`\`\`
            `, lotteryId)));
            return;        
        }

        lottery = new Object();
        lottery.lotteryId = lotteryId;
        lottery.creator = message.author.username;
        lottery.days = days;
        lottery.startTime = tools.getCurrentTime()
        lottery.endTime = tools.getCurrentTime() + days * this.DRAW_DAYS_INVERVAL_MS
        lottery.nextReminderTime = this.getNewLotteryReminderTime();
        lottery.guildName = message.channel.guild.name;
        lottery.channelName = "#" + message.channel.name
        lottery.channelId = message.channel.id;
        lottery.prize = prize;
        lottery.participantsIds = [];
        lottery.participantsNames = [];
        this.lotteries[lotteryId] = lottery;
        
        message.channel.send(tools.trimEachLine(util.format(`
            **A new Lottery** was created by **%s** for the prize of **%s**
            You have **%s** to join saying: 
            \`\`\`!lottery join %s\`\`\`
            `, lottery.creator, lottery.prize, this.getLotteryRemainingTime(lottery), lotteryId)));
    }

    handleJoinCommand(message, args) {
        //console.log("handleJoinCommand...");

        if (args.length != 1 || args[0] == '') {
            message.channel.send(tools.trimEachLine(`
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

        let participantId = message.author.id;
        let participantName = message.author.username;

        if (lottery.participantsIds.includes(participantId)) {
            message.channel.send(tools.trimEachLine(util.format(`
            **%s** ALREADY joined **%s's Lottery** for the prize of **%s** 
            The winner will be announced here in **%s**
            `, participantName, lottery.creator, lottery.prize, this.getLotteryRemainingTime(lottery))));
            return;
        }
        
        lottery.participantsIds.push(participantId)
        lottery.participantsNames.push(participantName)
        message.channel.send(tools.trimEachLine(util.format(`
            **%s** joined **%s's Lottery** for the prize of **%s** 
            The winner will be announced here in **%s**
            `, participantName, lottery.creator, lottery.prize, this.getLotteryRemainingTime(lottery))));
    }

    handleStatusCommand(message, args) {
        //console.log("handleStatusCommand...");

        if (args.length != 1 || args[0] == '') {
            message.channel.send(tools.trimEachLine(`
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


        message.channel.send(tools.trimEachLine(util.format(`
            **%s's Lottery** for the prize of **%s** status:
            \`\`\`
            elapsed:    %s
            remaining:  %s
            players:    %s
            \`\`\``, lottery.creator, lottery.prize, this.getLotteryElapsedTime(lottery), 
            this.getLotteryRemainingTime(lottery), lottery.participantsNames.join(', '))));
    }

    handleRemindCommand(message) {
        //console.log("handleRemindCommand...");

        let lotteryId = tools.zipInt(message.author.id);
        let lottery = this.lotteries[lotteryId];
        
        if (typeof lottery === 'undefined') {
            message.channel.send("No lottery found on behalf of **" + message.author.username + "**");
            return;
        }

        this.remindLottery(lottery);
    }

    handleDrawCommand(message) {
        //console.log("handleDrawCommand...");

        let lotteryId = tools.zipInt(message.author.id);
        let lottery = this.lotteries[lotteryId];
        
        if (typeof lottery === 'undefined') {
            message.channel.send("No lottery found on behalf of **" + message.author.username + "**");
            return;
        }

        this.drawLottery(lottery);
    }

    handleAbortCommand(message) {
        //console.log("handleAbortCommand...");

        let lotteryId = tools.zipInt(message.author.id);
        let lottery = this.lotteries[lotteryId];

        if (typeof lottery === 'undefined') {
            message.channel.send("No lottery found on behalf of **" + message.author.username + "**");
            return;
        }

        this.abortLottery(lottery);
    }

    handleFullStatus666Command(message) {
        //console.log("handleFullStatus666Command...");

        for (let lotteryId in this.lotteries) {
            //console.log("...listing lottery: " + lotteryId);
            let lottery = this.lotteries[lotteryId];

            message.channel.send(tools.trimEachLine(util.format(`
            \`\`\`
            id:         %s
            creator:    %s
            prize:      %s
            elapsed:    %s
            remaining:  %s
            players:    %s
            channel:    %s @ %s
            \`\`\``, lottery.lotteryId, lottery.creator, lottery.prize, 
            this.getLotteryElapsedTime(lottery), this.getLotteryRemainingTime(lottery), 
            lottery.participantsNames.join(', '), lottery.channelName, lottery.guildName,
            )) + "```" + util.inspect(lottery) + "```");
        }    
    }

    ///////////////////////////////////////////////////

    remindLottery(lottery) {
        //console.log("remindLottery..."); 
        
        lottery.nextReminderTime = this.getNewLotteryReminderTime();
        
        let msg = tools.trimEachLine(util.format(`
            **%s's Lottery** for the prize of **%s** is still running...
            You still have **%s** to join saying:
            \`\`\`!lottery join %s\`\`\`
            `, lottery.creator, lottery.prize, this.getLotteryRemainingTime(lottery), lottery.lotteryId));
        this.client.channels.fetch(lottery.channelId)
            .then(channel => channel.send(msg))
            .catch(console.error);
    }

    drawLottery(lottery) {
        //console.log("drawLottery..."); 

        let winner = tools.randomItemFromArray(lottery.participantsNames);
        let msg = tools.trimEachLine(util.format(`
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
        //console.log("drawLottery..."); 

        let msg = tools.trimEachLine(util.format(`
            **%s's Lottery** for the prize of **%s** was borted. :no_entry:
            `, lottery.creator, lottery.prize));
        this.client.channels.fetch(lottery.channelId)
            .then(channel => channel.send(msg))
            .catch(console.error);

        delete this.lotteries[lottery.lotteryId];
    }

    ///////////////////////////////////////////////////

    parseCmdAndArgs(message) {
        let input = message.content.substr(this.COMMAND_PREFIX.length).trim();
        let cmd =  input.split(' ')[0];
        let args = input.substr(cmd.length).trim().split(/(?:\s*,\s*)/); //split by ',' trimming inner spaces
        //console.log("...cmd = " + cmd);
        //console.log("...args = " + util.inspect(args));    
        return { cmd, args }
    }

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