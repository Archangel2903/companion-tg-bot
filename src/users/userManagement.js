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

    bot.on('new_chat_members', (msg) => newMember(msg));
    bot.on('left_chat_member', (msg) => departedUser(msg));

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

function newMember(msg) {
    const { chat: {id: chatId, title}, new_chat_participant: {id: userId, first_name, username = null} } = msg;
    if (!isUserExists(userId)) {
        addUser(userId, first_name, chatId, username);
    }

    bot.getChatAdministrators(chatId)
        .then((query) => {
            query.forEach((i) => {
                let {status, user: {id: user_id, is_bot}} = i;
                if (!is_bot) {
                    switch (status) {
                        case 'administrator':
                            bot.sendMessage(user_id, `👍🏻 В чат ${title} вошёл новый пользователь <a href="tg://user?id=${userId}">${first_name}</a> 👍🏻`, {parse_mode: 'html'});
                            break;
                        default:
                            creatorId = i.user.id;
                            break;
                    }
                }
            });

            bot.sendMessage(creatorId, `👍🏻 В чат ${title} вошёл новый пользователь <a href="tg://user?id=${userId}">${first_name}</a> 👍🏻`, {parse_mode: 'html'});
        })
        .catch((err) => {
            throw err.message;
        });

    bot.sendMessage(chatId, `🙂 Добро пожаловать <a href="tg://user?id=${userId}">${first_name}</a> 🙂`, {parse_mode: 'html'});
}

function departedUser({ chat: {id: chatId, title}, left_chat_participant: {id: userId, first_name} }) {
    bot.getChatAdministrators(chatId)
        .then(function (data) {
            data.forEach(function (i) {
                let {status, user: {id}} = i;

                if (status === 'creator') {
                    creatorId = id;
                } else if (status === 'administrator') {
                    bot.sendMessage(id, `👎🏻 Из чата ${title} вышел пользователь <a href="tg://user?id=${userId}">${userName}</a> 👎🏻`, {parse_mode: 'html'});
                }
            });

            bot.sendMessage(creatorId, `👎🏻 Из чата ${title} вышел пользователь <a href="tg://user?id=${userId}">${userName}</a> 👎🏻`, {parse_mode: 'html'});
        })
        .catch((err) => {
            throw err.message;
        });

    bot.sendMessage(chatId, `🙁 Прощай <a href="tg://user?id=${userId}">${first_name}</a> 🙁`, {parse_mode: 'html'});
}

module.exports = {messageListener, currentUserCoins, giveUserCoins, takeUserCoins, addUser, isUserExists}