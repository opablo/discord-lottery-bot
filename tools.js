const util = require('util')

module.exports = { 
    
    log: function(msg, obj) {
        if (typeof obj !== 'undefined') {
            console.log(msg + util.inspect(obj, {showHidden: false, depth: null, colors: true}));
        } else {
            console.log(msg);
        }
    },

    trimLines: function(input) {
        return input.replace(/(^\s+|\s+$)/gm, '')
    },

    randomItemFromArray: function(optionsArray) {
        let randomIndex = Math.floor( Math.random() * optionsArray.length );
        return optionsArray[randomIndex];
    },

    getCurrentTime: function() {
        now = new Date();
        return now.getTime()
    },

    getPossitiveMinsDiff: function(fromDate, toDate) {
        millis = Math.max(0, toDate - fromDate);
        return Math.ceil(millis / 1000 / 60);
    },

    getVerboseTimeDiff: function(fromDate, toDate) {
        let mins = this.getPossitiveMinsDiff(fromDate, toDate);
        let hours = Math.floor(mins / 60);
        mins -= hours * 60;
        let days = Math.floor(hours / 24);
        hours -= days * 24;
        let outputParams = [];
        if (days > 0) outputParams.push(days + " days");
        if (hours > 0) outputParams.push(hours + " hours");
        if (mins > 0 || outputParams.length == 0) outputParams.push(mins + " mins");
        return outputParams.join(', ');
    },

    //            0       8       16      24      32      40      48      56      64      72
    //            |       |       |       |       |       |       |       |       |       |
    ZIP_SYMBOLS: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",

    zipInt: function(number) {
        if (isNaN(Number(number)) || number === null || number === Number.POSITIVE_INFINITY)
            throw "The input is not valid";
        if (number < 0) 
            throw "Negative numbers not supported";

        var rixit; // like 'digit', only in some non-decimal radix 
        var residual = Math.floor(number);
        var result = '';
        while (true) {
            rixit = residual % this.ZIP_SYMBOLS.length
            result = this.ZIP_SYMBOLS.charAt(rixit) + result;
            residual = Math.floor(residual / this.ZIP_SYMBOLS.length);
            if (residual == 0)
                break;
            }
        return result;
    },

    unzipInt: function(rixits) {
        var result = 0;
        rixits = rixits.split('');
        for (let e = 0; e < rixits.length; e++) {
            result = (result * 64) + this.ZIP_SYMBOLS.indexOf(rixits[e]);
        }
        return result;
    }
}