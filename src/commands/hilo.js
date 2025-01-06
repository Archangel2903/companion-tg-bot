const {giveUserCoins, takeUserCoins} = require('../users/userManagement');
const {emoji} = require('../utils/helpers');

const chatGame = new Map();

function hilo(bot) {
    bot.onText(/^\/hilo/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;
        if (!getGameState(chat_id)) {
            chatGame.set(chat_id, {
                gameOn: true,
                currentNum: getRandomNumber(),
                previousNum: null,
            });
            const gameState = getGameState(chat_id);

            bot.sendMessage(chat_id, `Игра началась\nНачальное значение *${gameState.currentNum}*`, {
                parse_mode: 'markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: `${emoji.arrow_up} Больше ${emoji.arrow_up}`,
                            callback_data: `hilo_over_${chat_id}`,
                        }], [{
                            text: `${emoji.arrow_down} Меньше ${emoji.arrow_down}`,
                            callback_data: `hilo_less_${chat_id}`,
                        }]
                    ]
                }
            });
        } else {
            bot.sendMessage(chat_id, 'Игра уже запущена');
        }
    });

    bot.onText(/^\/endHilo/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;

        if (getGameState(chat_id)) {
            removeGameState(chat_id);
            bot.sendMessage(chat_id, 'Игра HiLo остановлена');
        } else {
            bot.sendMessage(chat_id, 'Игра не запущена');
        }
    });

    bot.on('callback_query', (query) => {
        try {
            const {from: {id: user_id}, message: {message_id, chat: {id: chat_id}}, data} = query;
            const gameState = getGameState(chat_id);

            if (!gameState) return false;
            newStepGame(chat_id);
            const messageWin = `${emoji.like}*Успех!* +10${emoji.money}\n\nНовое значение: *${gameState.currentNum}*\nПредыдущее значение: ${gameState.previousNum}`;
            const messageLost = `${emoji.dislike}*Неудача* -10${emoji.money}\n\nНовое значение: *${gameState.currentNum}*\nПредыдущее значение: ${gameState.previousNum}`;
            let messageState = {
                chat_id: chat_id,
                message_id: message_id,
                parse_mode: 'markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{text: `${emoji.arrow_up} Больше ${emoji.arrow_up}`, callback_data: `hilo_over_${chat_id}`}],
                        [{text: `${emoji.arrow_down} Меньше ${emoji.arrow_down}`, callback_data: `hilo_less_${chat_id}`}]
                    ]
                }
            }

            const {currentNum, previousNum} = gameState;

            switch (data) {
                case `hilo_over_${chat_id}`:
                    if (currentNum > previousNum) {
                        giveUserCoins(user_id, 10);
                        bot.editMessageText(messageWin, messageState);
                    } else {
                        takeUserCoins(user_id, 10);
                        bot.editMessageText(messageLost, messageState);
                    }
                    break;

                case `hilo_less_${chat_id}`:
                    if (currentNum < previousNum) {
                        giveUserCoins(user_id, 10);
                        bot.editMessageText(messageWin, messageState);
                    } else {
                        takeUserCoins(user_id, 10);
                        bot.editMessageText(messageLost, messageState);
                    }
                    break;
            }
        } catch (err) {
            console.log(err.message);
        }
    });
}

function newStepGame(chatId) {
    const gameState = getGameState(chatId);
    const {currentNum} = gameState;

    gameState.previousNum = currentNum;
    gameState.currentNum = getRandomNumber();
}

function getRandomNumber() {
    return Math.ceil(Math.random() * 10);
}

function getGameState(id) {
    return chatGame.get(id);
}

function removeGameState(id) {
    chatGame.delete(id);
}

module.exports = {hilo}