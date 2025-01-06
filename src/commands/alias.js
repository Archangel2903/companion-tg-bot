const {query} = require('../database/db');
const {giveUserCoins, takeUserCoins} = require('../users/userManagement');

// const chatGame = {}
const chatGame = new Map();
const messages = {
    rules: `<b>Игра Alias</b>\n
Правила игры:\n
-Запустите игру командой /startAlias\n
-Один из игроков должен стать ведущим.\nВедущему откроется слово которое нужно объяснить.\n
-Когда ведущий называет слово он получает штраф 20 монеток и игра завершается\n
-За отгаданное слово игрок который первый напишет правильное слово получает 10 монеток и объявляется следующий раунд.\n
-Для завершения игры используйте компанду /endAlias`,
    gameStarted: 'Игра уже запущена',
    notLeader: 'Вы не ведущий. Дождитесь своей очереди.',
    noGame: 'Игра ещё не запущена.\nИспользуйте /startAlias для начала.',
    endGame: 'Игра завершена.\nИспользуйте /startAlias для начала.',
};

function aliasStart(bot) {
    // Стартовая команда
    bot.onText(/^\/alias/gi, (msg) => {
        try {
            const {chat: {id: chat_id, type}} = msg;
            if (type === 'group' || type === 'supergroup') {
                if (chatGame.has(chat_id)) {
                    bot.sendMessage(chat_id, messages.gameStarted);
                    return;
                }

                chatGame.set(chat_id, {
                    gameOn: true,
                    currentLeader: null,
                    currentWord: '',
                });

                bot.sendMessage(chat_id, 'Нажмите кнопку, чтобы стать ведущим.', {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: 'Стать ведущим', callback_data: `become_leader_${chat_id}`}],
                            [{text: 'Правила', callback_data: 'rule'}]
                        ]
                    }
                });
            }
        } catch (error) {
            console.error('[ERROR start alias]', error.message);
        }
    });

    bot.onText(/^\/ruleAlias/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;
        bot.sendMessage(chat_id, messages.rules, {parse_mode: 'html'});
    });
}

function handleAliasButton(bot) {
// Обработка ответов на нажатие кнопки
    bot.on('callback_query', (callbackQuery) => {
        try {
            const {id, message: {message_id, chat: {id: chat_id}}, from: {id: user_id}, data} = callbackQuery;
            const gameState = chatGame.get(chat_id);

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
                case `rule`:
                    bot.sendMessage(chat_id, messages.rules, {parse_mode: 'html'});
                    break;
                default:
                    bot.answerCallbackQuery(id, {text: 'Неверное действие.'});
                    break;
            }
        } catch (err) {
            console.error('[ERROR callback query alias]', err.message);
        }
    });
}

function handleAliasMessage(bot) {
    // Прослушка сообщений на вернуй ответ
    bot.on('message', (msg) => {
        try {
            if ('text' in msg) {
                const {from: {id: user_id, first_name}, chat: {id: chat_id}, text} = msg;
                if (!chatGame.has(chat_id)) return;
                let gameState = chatGame.get(chat_id);
                const guess = isWordInMessage(gameState.currentWord.toLowerCase(), text);

                if (guess) {
                    if (gameState.currentLeader !== user_id) {
                        //Если ответил не ведущий и слово правильное
                        addUserRating(chat_id, user_id, first_name, gameState);
                        giveUserCoins(user_id, 10);
                        gameState.currentLeader = null;
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
                    } else if (gameState.currentLeader === user_id) {
                        // Если ведущий назвал правильное слово
                        takeUserCoins(user_id, 20);
                        aliasEnd(bot, chat_id);
                        bot.sendMessage(chat_id, `${first_name}, вы не должны писать слово. \nВы получаете штраф.`);
                    }
                }
            }
        } catch (error) {
            console.error('[ERROR: alias message listener]', error.message);
        }
    });
}

function aliasEnd(bot, chatId = null) {
    try {
        if (chatId) {
            chatGame.delete(chatId);
            bot.sendMessage(chatId, messages.endGame);
        } else {
            bot.onText(/^\/endAlias/gi, (msg) => {
                const {chat: {id}} = msg;
                const gameState = chatGame.get(id);
                if (gameState && gameState.gameOn) {
                    chatGame.delete(id);
                    bot.sendMessage(id, messages.endGame);
                }
            });
        }
    } catch (err) {
        console.error('[ERROR alias end]', err.message);
    }
}

function aliasRating(bot) {
    bot.onText(/^\/ratingAlias/gi, (msg) => {
        try {
            const {chat: {id: chat_id}} = msg;
            bot.sendMessage(chat_id, getUserRatings(chat_id), {parse_mode: 'html'});
        } catch (err) {
            console.error('[ERROR rating alias]', err.message)
        }
    });
}

function getRandomWord() {
    // Выполняем SQL-запрос для получения случайного слова из таблицы words
    const result = query("SELECT word FROM words ORDER BY RANDOM() LIMIT 1;");
    return result.length > 0 ? result[0].word : null;
}

function updateWordRating(word, ratingChange) {
    try {
        const existingWord = query("SELECT * FROM words_ratings WHERE word = ?", [word]);

        if (existingWord.length > 0) {
            if (ratingChange > 0) {
                query("UPDATE words_ratings SET likes = likes + 1 WHERE word = ?", [word]);
            } else {
                query("UPDATE words_ratings SET dislikes = dislikes + 1 WHERE word = ?", [word]);
            }
        } else {
            query("INSERT INTO words_ratings (word, likes, dislikes) VALUES (?, ?, ?)", [word, ratingChange > 0 ? 1 : 0, ratingChange < 0 ? 1 : 0]);
        }
    } catch (err) {
        console.error('ERROR update word rating', err.message);
    }
}

function isWordInMessage(word, message) {
    try {
        if (!word || !message) return false;

        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/gim, '\\$&');
        const regex = new RegExp(`(^|\\W)${escapeRegex(word)}(\\W|$)`, 'gim');
        return regex.test(message);
    } catch (err) {
        console.error('ERROR isWordInMessage', err.message);
    }
}

/* words_top */
function addUserRating(chatId, userId, userName, gameState) {
    // Проверяем, есть ли пользователь в текущем чате
    const userInChat = isUserInChatRating(chatId, userId);

    if (userInChat.length > 0) {
        query("UPDATE words_top SET rating = rating + 1 WHERE chat_id = ? AND user_id = ?", [chatId, userId])
    } else {
        updateOrInsertRating(chatId, userId, userName);
    }
}

function updateOrInsertRating(chatId, userId, userName) {
    const userInChat = isUserInChatRating(chatId, userId);

    if (userInChat.length > 0) {
        query("UPDATE words_top SET rating = rating + 1 WHERE chat_id = ? AND user_id = ?", [chatId, userId]);
    } else {
        query("INSERT INTO words_top (chat_id, user_id, user_name, rating) VALUES (?, ?, ?, ?)", [chatId, userId, userName, 1]);
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

module.exports = {aliasStart, aliasEnd, aliasRating, handleAliasMessage, handleAliasButton, getRandomWord, isWordInMessage}