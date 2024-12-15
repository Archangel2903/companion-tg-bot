const config = require('../../configuration.json')
const {sqlite, query} = require('../database/db');
const {log} = require('../utils/helpers');

function messageListener(bot) {
    bot.on('message', (msg) => {
        const {from: {id: user_id, first_name, username = null}, chat: {type}, text} = msg;
        const {chat: {title}, date} = msg;

        console.log(`${title}: [${first_name}] - ${text}`);

        if (msg.dice) {
            if (msg.dice.value > 4) {
                bot.sendMessage(msg.chat.id, `Молодец, отличный результат ${msg.dice.value}`);
            }
            else {
                bot.sendMessage(msg.chat.id, `${msg.dice.value}, в следующий раз повезёт`);
            }
        }

        if (!isUserExists(user_id)) {
            addUser(user_id, first_name, username);
            log('INFO')(`Пользователь ${first_name} добавлен в таблицу users`);
        }

        if (type === 'private' && user_id === +config.creator_id) {
            if (msg.entities[0].type !== 'bot_command') {
                let toChat = '-1002418775017';
                bot.sendMessage(toChat, text);
            }
        }
    });
}

function addUser(uId, uName, username, coinValue = 100) {
    sqlite.insert("users", {user_id: uId, firstname: uName, username: username, user_coins: coinValue}, function (res) {
        if (res.error) {
            throw res.error;
        }
    });
}

function isUserExists(uId) {
    return query("SELECT COUNT(*) as cnt FROM users WHERE `user_id` = ?", [uId])[0].cnt !== 0;
}

module.exports = {messageListener, addUser, isUserExists}