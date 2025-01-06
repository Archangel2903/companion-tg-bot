const {currentUserCoins} = require('../users/userManagement');

function balance(bot) {
    bot.onText(/^\/balance/, (msg) => {
        const {from: {id: user_id, first_name}, chat: {id: chat_id}} = msg;
        if ('reply_to_message' in msg) {
            const {reply_to_message: {from: {id: user_id, first_name}}} = msg;
            const coins = currentUserCoins(user_id);
            bot.sendMessage(chat_id, `*${first_name}*, на твоём счету:\n💰 *${coins}* 💰`, {parse_mode: 'markdown'});
        } else {
            const coins = currentUserCoins(user_id);
            bot.sendMessage(chat_id, `*${first_name}*, на твоём счету:\n💰 *${coins}* 💰`, {parse_mode: 'markdown'});
        }

        const coins = currentUserCoins(user_id);

    });
}

module.exports = {balance}