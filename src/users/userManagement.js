require('dotenv').config();
const {sqlite, query} = require('../database/db');
const {log} = require('../utils/helpers');
const creatorId = parseInt(process.env.CREATOR_ID, 10);

function messageListener(bot) {
    bot.on('message', (msg) => {
        const {from: {id: user_id, first_name, username = null}, chat: {type}, text} = msg;
        const {chat: {title}, date} = msg;

        console.log(`${title}: [${first_name}] - ${text}`);



        if (!isUserExists(user_id)) {
            addUser(user_id, first_name, username);
            log('INFO')(`Пользователь ${first_name} добавлен в таблицу users`);
        }

        if (type === 'private' && user_id === creatorId) {
            if (!msg.entities) {
                bot.sendMessage(-1002418775017, text);
                bot.sendMessage(-1001163726089, text);
                bot.sendMessage(-1001371079286, text);
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