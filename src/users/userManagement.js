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
                console.log(`message to chats from creator`, msg);
                // bot.sendMessage(-1002418775017, text);
                // bot.sendMessage(-1001163726089, text);
                // bot.sendMessage(-1001371079286, text);
            }
        }

        lottery(msg);
    });

    function lottery(msg) {
        const {chat: {id: chat_id}, from: {id: user_id}} = msg;

        if ('dice' in msg) {
            const {dice: {value}} = msg;
            let message = ''

            if(value >= 60) {
                message = `Прекрасный результат ${value}`;
                giveUserCoins(user_id, 100);
            }
            else if (value > 44 && value < 60) {
                message = `Молодец, отличный результат ${value}`;
                giveUserCoins(user_id, 50);
            }
            else if (value > 4 && value < 44) {
                message = `Молодец, хороший ре зультат результат ${value}`;
                giveUserCoins(user_id, 10);
            }
            else {
                message = `${value}, в следующий раз повезёт`;
            }

            bot.sendMessage(chat_id, message);
        }
    }
}

function addUser(uId, uName, username, coinValue = 100) {
    sqlite.insert("users", {user_id: uId, firstname: uName, username: username, user_coins: coinValue}, function (res) {
        if (res.error) {
            throw res.error;
        }
    });
    log('INFO')(`Пользователь ${uName} добавлен в таблицу users`);
}

function isUserExists(uId) {
    return query("SELECT COUNT(*) as cnt FROM users WHERE `user_id` = ?", [uId])[0].cnt !== 0;
}

function currentUserCoins(userId) {
    return query(`SELECT user_coins FROM users WHERE user_id = ?`, [userId])[0].user_coins;
}

function updateUserCoins(userId, x) {
    query("UPDATE users SET user_coins = ? WHERE `user_id` = ?", [x, userId]);
}

function giveUserCoins(userId, x) {
    const userCoins = currentUserCoins(userId);
    const result = Number(userCoins) + Number(x);
    updateUserCoins(userId, result);
}

function takeUserCoins(userId, x) {
    const userCoins = currentUserCoins(userId);
    const result = Number(userCoins) - Number(x);

    if (result > 0) {
        updateUserCoins(userId, result);
    }
    else {
        updateUserCoins(userId, 0);
    }
}

module.exports = {messageListener, currentUserCoins, giveUserCoins, takeUserCoins, addUser, isUserExists}