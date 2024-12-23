const {giveUserCoins, takeUserCoins} = require('../users/userManagement');
const {log} = require('../utils/helpers');

function test(bot, creatorId) {
    bot.onText(/^\/test$/, (msg) => {
        const {from: {id: user_id}, chat: {id: chat_id}} = msg;
        if (creatorId !== user_id) return false;
        console.log(msg);
        console.log(creatorId === user_id);
        bot.sendMessage(chat_id, `<pre>${JSON.stringify(msg, null, 2)}</pre>`, {parse_mode: 'html'});
    });

    bot.onText(/^\/gc (\d+)$/gi, (msg, match) => {
        const { from: {id: user_id} } = msg;
        const coins = match[1];
        giveUserCoins(user_id, coins);
    });

    bot.onText(/^\/tc (\d+)$/gi, (msg, match) => {
        const { from: {id: user_id} } = msg;
        const coins = match[1];
        takeUserCoins(user_id, coins);
    });
}

module.exports = { test }