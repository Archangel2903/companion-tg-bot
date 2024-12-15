const {sqlite, query} = require('../database/db');

const chatGame = {}
const messages = {
    gameStarted: 'Игра уже запущена',
    notLeader: 'Вы не ведущий. Дождитесь своей очереди.',
    noGame: 'Игра ещё не запущена.\nИспользуйте /startAlias для начала.',
    endGame: 'Игра завершена.\nИспользуйте /startAlias для начала.',
};

function aliasStart(bot) {
    // Стартовая команда
    bot.onText(/^\/startAlias/gi, (msg) => {
        if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
            const {chat: {id: chat_id}} = msg;

            if (!chatGame[chat_id]) {
                chatGame[chat_id] = {gameOn: false, currentLeader: null, currentWord: ''};
            }

            if (!chatGame[chat_id].gameOn) {
                chatGame[chat_id].gameOn = true;
                bot.sendMessage(chat_id, 'Нажмите кнопку, чтобы стать ведущим.', {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: 'Стать ведущим',
                            callback_data: `become_leader_${chat_id}`
                        }]]
                    }
                });
            } else {
                bot.sendMessage(chat_id, messages.gameStarted);
            }
        }
    });

    // Обработка ответов на нажатие кнопки
    bot.on('callback_query', (callbackQuery) => {
        const {id, message: {message_id, chat: {id: chat_id}}, from: {id: user_id}, data} = callbackQuery;
        const gameState = chatGame[chat_id];

        if (!gameState || !gameState.gameOn) return;

        switch (data) {
            case `become_leader_${chat_id}`:
                if (!gameState.currentLeader) {
                    gameState.currentLeader = user_id;
                    gameState.currentWord = getRandomWord();
                    bot.answerCallbackQuery(id, {
                        text: `Ваше слово: ${gameState.currentWord}`,
                        show_alert: true
                    });
                    bot.sendMessage(chat_id, `Ведущим назначен ${callbackQuery.from.first_name}`, {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: 'Посмотреть слово',
                                callback_data: `become_leader_${chat_id}`
                            }]]
                        }
                    });
                    bot.deleteMessage(chat_id, message_id);
                    return;
                }

                if (gameState.currentLeader === user_id) {
                    bot.answerCallbackQuery(id, {
                        text: `Ваше слово: ${gameState.currentWord}`,
                        show_alert: true
                    });
                } else {
                    bot.answerCallbackQuery(id, {
                        text: messages.notLeader,
                        show_alert: true
                    });
                }
                break;
            case `like_word_${chat_id}`:
                updateWordRating(gameState.currentWord, 1);
                bot.answerCallbackQuery(id, {text: 'Спасибо за оценку!'});
                bot.editMessageReplyMarkup({
                    inline_keyboard: [[{
                        text: 'Следующий раунд',
                        callback_data: `become_leader_${chat_id}`
                    }]]
                }, {chat_id, message_id});
                break;
            case `dislike_word_${chat_id}`:
                updateWordRating(gameState.currentWord, -1);
                bot.answerCallbackQuery(id, {text: 'Спасибо за оценку!'});
                bot.editMessageReplyMarkup({
                    inline_keyboard: [[{
                        text: 'Следующий раунд',
                        callback_data: `become_leader_${chat_id}`
                    }]]
                }, {chat_id, message_id});
                break;
            default:
                bot.answerCallbackQuery(id, {text: 'Неверное действие.'});
                break;
        }
    });

    // Прослушка сообщений на вернуй ответ
    bot.on('message', (msg) => {
        if ('text' in msg) {
            const {from: {id: user_id, first_name}, chat: {id: chat_id}, text} = msg;
            const gameState = chatGame[chat_id];
            if (!gameState) return;
            const guess = isWordInMessage(gameState.currentWord.toLowerCase(), text)

            if (guess) {
                if (gameState.currentLeader !== user_id) {
                    //Если ответил не ведущий и слово правильное
                    bot.sendMessage(chat_id, `Поздравляем, ${first_name} угадал слово!`, {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: 'Следующий раунд',
                                callback_data: `become_leader_${chat_id}`
                            }],
                                [{
                                    text: '👍 этому слову',
                                    callback_data: `like_word_${chat_id}`
                                }, {
                                    text: `👎 этому слову`,
                                    callback_data: `dislike_word_${chat_id}`
                                }]]
                        }
                    });
                    giveCoins(gameState.currentLeader, 10);
                    gameState.currentLeader = null;
                    addRating(chat_id, user_id, first_name, gameState);
                    giveCoins(user_id, 10);
                } else if (gameState.currentLeader === user_id) {
                    // Если ведущий назвал правильное слово
                    bot.sendMessage(chat_id, `${first_name}, вы не должны писать слово. Вы получаете штраф.`);
                    takeCoins(user_id, 20);
                    aliasEnd(bot, chat_id);
                }
            }
        }
    });
}

function aliasEnd(bot, chatId = null) {
    if (chatId) {
        chatGame[chatId] = null
        bot.sendMessage(chatId, messages.noGame);
    }
    else {
        bot.onText(/^\/endAlias/gi, (msg) => {
            const {chat: {id}} = msg;
            if (chatGame[id] && chatGame[id].gameOn) {
                chatGame[id] = null

                bot.sendMessage(id, messages.endGame);
            }
        });
    }
}

function aliasRating(bot) {
    bot.onText(/^\/ratingAlias/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;

        bot.sendMessage(chat_id, getUserRatings(chat_id), {parse_mode: 'html'});
    });
}

function getRandomWord() {
    // Выполняем SQL-запрос для получения случайного слова из таблицы words
    const result = query("SELECT word FROM words ORDER BY RANDOM() LIMIT 1;");
    return result.length > 0 ? result[0].word : null;
}

function giveCoins(userId, x) {
    // Логика начисления монеток пользователю
    const result = query('SELECT `user_coins` FROM users WHERE `user_id` = ?', [userId])[0].user_coins;
    let update_coins = result + x;
    query("UPDATE users SET `user_coins` = ? WHERE `user_id` = ?", [update_coins, userId]);
}

function takeCoins(userId, x) {
    // Логика снятия монеток с пользователя
    const result = query('SELECT `user_coins` FROM users WHERE `user_id` = ?', [userId])[0].user_coins;
    let update_coins = result - x;
    query("UPDATE users SET `user_coins` = ? WHERE `user_id` = ?", [update_coins, userId]);
}

function addRating(chatId, userId, userName, gameState) {
    // Проверяем, есть ли пользователь в текущем чате
    const userInChat = isUserInChatRating(chatId, userId);

    if (userInChat.length > 0) {
        updateWordRating(gameState.currentWord, 1);
    } else {
        const userInOtherChat = query("SELECT * FROM words_top WHERE user_id = ?", [userId]);

        if (userInOtherChat.length > 0) {
            query("INSERT INTO words_top (chat_id, user_id, user_name, rating) VALUES (?, ?, ?, 1)", [chatId, userId, userName]);
        } else {
            query("INSERT INTO words_top (chat_id, user_id, user_name, rating) VALUES (?, ?, ?, 1)", [chatId, userId, userName]);
        }
    }
}

function updateWordRating(word, ratingChange) {
    // Проверяем, есть ли слово в таблице words_ratings
    const existingWord = query("SELECT * FROM words_ratings WHERE word = ?", [word]);

    if (existingWord.length > 0) {
        // Если слово есть, обновляем его рейтинг
        if (ratingChange > 0) {
            query("UPDATE words_ratings SET likes = likes + ? WHERE word = ?", [1, word]);
        } else {
            query("UPDATE words_ratings SET dislikes = dislikes + ? WHERE word = ?", [1, word]);
        }
    } else {
        // Если слова нет, добавляем его с начальным рейтингом
        query("INSERT INTO words_ratings (word, likes, dislikes) VALUES (?, ?, ?)", [word, 0, 0]);
    }
}

function isUserInChatRating(chatId, userId) {
    return query("SELECT * FROM words_top WHERE chat_id = ? AND user_id = ?", [chatId, userId]);
}

function getUserRatings(chatId) {
    const result = query(`SELECT user_name, rating
                          FROM words_top
                          WHERE chat_id = ?
                          ORDER BY rating DESC LIMIT 10`, [chatId]);

    if (result.length > 0) {
        let message = 'Рейтинг пользователей чата:\n\n';

        let result_message = result.reduce((acc, user) => {
            acc += `${user.user_name} - ${user.rating}\n`;
            return acc;
        }, '');

        return message + result_message;
    } else {
        return 'В этом чате пока нет пользователей с рейтингом.';
    }
}

function isWordInMessage(word, message) {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\W)${escapeRegex(word)}(\\W|$)`, 'gim');
    return regex.test(message);
}


module.exports = {aliasStart, aliasEnd, aliasRating}