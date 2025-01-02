const { currentUserCoins } = require('../users/userManagement');

function balance(bot) {
    bot.onText(/^\/balance/, (msg) => {
        const {from: {id: user_id, first_name}, chat: {id: chat_id}} = msg;
        const coins = currentUserCoins(user_id);

        bot.sendMessage(chat_id, `*${first_name}*, на твоём счету:\n💰 *${coins}* 💰`, {parse_mode: 'markdown'});
    });
}

module.exports = { balance }