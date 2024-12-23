const {isUserExists, addUser} = require('../users/userManagement');
const {log} = require('../utils/helpers');

function startCommand(bot) {
    bot.onText(/^\/start$/gi, (msg) => {
        const {from: {id: user_id, first_name, username = null}, chat: {id: chat_id}} = msg;

        bot.sendMessage(chat_id, `Привет <a href="tg://user?id=${user_id}">${first_name}</a>`, {parse_mode: 'html'});
        if (!isUserExists(user_id)) {
            addUser(user_id, first_name, username);
        }
    });
}

module.exports = { startCommand };