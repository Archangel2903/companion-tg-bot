const {isUserExists, addUser} = require('../users/userManagement');
const {log} = require('../utils/helpers');

function startCommand(bot) {
    bot.onText(/^\/start$/, (msg) => {
        const {from: {id: user_id, first_name, username = null}, chat: {id: chat_id}} = msg;

        if (!isUserExists(user_id)) {
            addUser(user_id, first_name, username);
            log('INFO')(`Пользователь ${first_name} добавлен в таблицу users`);
        }

        bot.sendMessage(chat_id, `Привет <a href="tg://user?id=${user_id}">${first_name}</a>`, {parse_mode: 'html'});
    });
}

module.exports = { startCommand };