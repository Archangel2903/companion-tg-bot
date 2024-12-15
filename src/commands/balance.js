const { query } = require('../database/db');

function balance(bot) {
    bot.onText(/^\/balance/, (msg) => {
        const {from: {id: user_id, first_name}, chat: {id: chat_id}} = msg;

        let data_coins = query("SELECT user_coins FROM users WHERE user_id = ?", [user_id])[0].user_coins;
        // let data_coins = sqlite.run("SELECT coins_value FROM users WHERE user_id = ?", [userId])[0].coins_value;

        bot.sendMessage(chat_id, `${first_name}, на твоём счету:\n💰${data_coins}💰`);
    });
}

module.exports = { balance }