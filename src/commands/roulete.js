const {giveUserCoins, takeUserCoins} = require('../users/userManagement');

const rouletteNumbers = [
    {number: 0, color: 'green'},
    {number: 1, color: 'red'},
    {number: 2, color: 'black'},
    {number: 3, color: 'red'},
    {number: 4, color: 'black'},
    {number: 5, color: 'red'},
    {number: 6, color: 'black'},
    {number: 7, color: 'red'},
    {number: 8, color: 'black'},
    {number: 9, color: 'red'},
    {number: 10, color: 'black'},
    {number: 11, color: 'black'},
    {number: 12, color: 'red'},
    {number: 13, color: 'black'},
    {number: 14, color: 'red'},
    {number: 15, color: 'black'},
    {number: 16, color: 'red'},
    {number: 17, color: 'black'},
    {number: 18, color: 'red'},
    {number: 19, color: 'red'},
    {number: 20, color: 'black'},
    {number: 21, color: 'red'},
    {number: 22, color: 'black'},
    {number: 23, color: 'red'},
    {number: 24, color: 'black'},
    {number: 25, color: 'red'},
    {number: 26, color: 'black'},
    {number: 27, color: 'red'},
    {number: 28, color: 'black'},
    {number: 29, color: 'black'},
    {number: 30, color: 'red'},
    {number: 31, color: 'black'},
    {number: 32, color: 'red'},
    {number: 33, color: 'black'},
    {number: 34, color: 'red'},
    {number: 35, color: 'black'},
    {number: 36, color: 'red'}
];
const chatGame = new Map();
const message = {
    gameStart: `Начинаем рулетку. \nДелайте ваши ставки \nℹ️[ставка, цель ставки (Ч,К,число)]ℹ️`,
    closeBets: 'ℹ️Ставки больше не принимаются!ℹ️',
    gifBet: 'CgACAgQAAx0CUbkCdgABDQReZ2c5_xGDzcX5G9mVfZvWj7iU1xQAAiUDAAKO4QRTlXm9o9WNDKQ2BA',
    gifSpin: 'CgACAgQAAx0CUbkCdgABDQGpZ14JHEAx1GgsS0aL09u-GAnnG2AAAjEDAAJs-wVTcxdLMgqBtaM2BA',
    black: '⚫️',
    red: '🔴',
    green: '🟢',
    rules: `<b>Игра в рулетку</b>\n
-Делайте ставку на Красное 🔴, Черное ⚫️или любое число [0-36]\n
-Пример ставки "10 ч" - 10 монеток на черное\n
-После запуска игры /roulette даётся 1 минута на приём ставок, после чего рулетка будет сыграна и определены победители\n`,
}

function roulette(bot) {
    bot.onText(/^\/roulette/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;

        createGameState(chat_id);
        const gameState = getGameState(chat_id);

        startAction(msg, gameState);
    });

    bot.onText(/^\/ruleRoulette/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;
        bot.sendMessage(chat_id, message.rules, {parse_mode: 'html'});
    });

    bot.onText(/^(\d+) (ч|к|\d+)$/i, (msg, match) => {
        const {from: {id: user_id, first_name}, chat: {id: chat_id}} = msg;
        const gameState = getGameState(chat_id);
        if (!gameState) return;
        const amount = parseInt(match[1]);
        const position = match[2] === 'к' ? 'red' : match[2] === 'ч' ? 'black' : parseInt(match[2]);
        let textMessage = ``;

        switch (position) {
            case 'red':
                textMessage = `Ваша ставка принята: ${amount} на ${message.red}`;
                break;
            case 'black':
                textMessage = `Ваша ставка принята: ${amount} на ${message.black}`;
                break;
            case 0:
                textMessage = `Ваша ставка принята: ${amount} на ${message.green}`;
                break;
            default:
                textMessage = `Ваша ставка принята: ${amount} на ${position}`;
                break;
        }

        if (gameState.openBets) {
            takeUserCoins(user_id, amount);
            bet(gameState, {'firstname': first_name, 'user_id': user_id, 'amount': amount, 'position': position});
            bot.sendMessage(chat_id, textMessage);
        } else {
            bot.sendMessage(chat_id, 'Ставки не принимаются');
        }
    });

    function startAction(msg, state) {
        const {chat: {id: chat_id}} = msg;
        bot.sendDocument(chat_id, message.gifBet, {caption: message.gameStart})
            .then(data => {
                const {message_id, chat: {id: chat_id}} = data;

                // Таймер на 1 минуту приёма ставок
                setTimeout(function () {
                    bot.deleteMessage(chat_id, message_id);
                    spinAction(data, state);
                }, 60000);
            });
    }

    function spinAction(msg, state) {
        const {chat: {id: chat_id}} = msg;
        state.openBets = false;
        bot.sendDocument(chat_id, message.gifSpin, {caption: `Крутим...\n${message.closeBets}`})
            .then(data => {
                const {message_id, chat: {id: chat_id}, from: {id: user_id}} = data;
                const spinResult = getSpinResult();
                const winners = determineWinner(spinResult, state.bets);

                setTimeout(function () {
                    bot.deleteMessage(chat_id, message_id);

                    if (winners.length > 0) {
                        winners.map((win) => {giveUserCoins(win.user_id, win.amount*2)});
                        const winnersList = winners.reduce((acc, winner) => {
                            return acc += `${winner.firstname} выигрывает - ${winner.amount * 2}\n`;
                        }, '');
                        bot.sendMessage(chat_id, `Выиграло ${spinResult.number} ${message[spinResult.color]}\n\nПобедители:\n${winnersList}`);
                    }
                    else {
                        bot.sendMessage(chat_id, `Выиграло ${spinResult.number} ${message[spinResult.color]}\nНикто не выиграл`);
                    }

                    removeGameState(chat_id);
                }, 3000);
            });
    }
}

function createGameState(id) {
    chatGame.set(id, {
        gameOn: true,
        openBets: true,
        bets: [],
    });
}

function getGameState(id) {
    return chatGame.get(id);
}

function removeGameState(id) {
    chatGame.delete(id);
}

function bet(game, bet) {
    game.bets.push(bet);
}

function getSpinResult() {
    const randomIndex = Math.floor(Math.random() * rouletteNumbers.length);
    return rouletteNumbers[randomIndex];
}

function determineWinner(result, bets) {
    return bets.filter(bet => bet.position === result.number || bet.position === result.color);
}

module.exports = {roulette};

/*
function placeBet(userId, userName, amount, position) {
    bets.push({userId, userName, amount, position});
}

function spinRoulette() {
    const randomIndex = Math.floor(Math.random() * rouletteNumbers.length);
    return rouletteNumbers[randomIndex];
}

function determineWinners(result) {
    return bets.filter(bet => {
        return bet.position === result.number || bet.position === result.color;
    });
}

function resetBets() {
    bets.length = 0;
}

function roulette(bot) {
    bot.onText(/^\/roulette/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;

        chatGame.set(chat_id, {
            gameOn: true,
            openBets: true,
            bets: [],
        })
        const gameState = chatGame.get(chat_id);

        bot.sendDocument(chat_id, message.rouletteBets, {caption: message.gameStart});

        // Запускаем таймер на 2 минуты
        setTimeout(() => {
            gameState.openBets = false;
            bot.sendMessage(chat_id, message.closeBets, {
                reply_markup: {
                    inline_keyboard: [[{
                        text: 'Крутить',
                        callback_data: `spin${chat_id}`,
                    }]]
                }
            });
        }, 60000); // 2 минуты = 120000 миллисекунд
    });

    bot.onText(/^(\d+) (ч|к|\d+)$/i, (msg, match) => {
        const {from: {id: user_id}, chat: {id: chat_id}} = msg;
        const amount = parseInt(match[1]);
        const position = match[2] === 'к' ? 'red' : match[2] === 'ч' ? 'black' : parseInt(match[2]);
        const gameState = chatGame.get(chat_id);
        if (!gameState.gameOn) return;
        let textMessage = `Ваша ставка принята: ${amount} на ${position}`;

        switch (position) {
            case 'red':
                textMessage = `Ваша ставка принята: ${amount} на 🔴`;
                break;
            case 'black':
                textMessage = `Ваша ставка принята: ${amount} на ⚫️`;
                break;
            case 0:
                textMessage = `Ваша ставка принята: ${amount} на 🟢`;
                break;
            default:
                textMessage = `Ваша ставка принята: ${amount} на ${position}`;
                break;
        }

        if (gameState.openBets) {
            takeUserCoins(user_id, amount);
            placeBet(user_id, amount, position);
            bot.sendMessage(chat_id, textMessage);
        } else {
            bot.sendMessage(chat_id, 'Ставки не принимаются');
        }
    });

    bot.onText(/^\/spin/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;
        const gameState = chatGame.get(chat_id);
        const result = spinRoulette();

        bot.sendDocument(chat_id, message.rouletteSpinner)
            .then(() => {
                setTimeout(() => {
                    bot.sendMessage(chat_id, `Результат: ${result.number} (${message[result.color]})`)
                        .then(() => {
                            const winners = determineWinners(result);

                            if (winners.length > 0) {
                                winners.forEach(winner => {
                                    bot.sendMessage(chat_id, `Победитель: ${winner.userId} выиграл ${winner.amount * 2}`);
                                });
                            } else {
                                bot.sendMessage(chat_id, 'К сожалению, никто не выиграл.');
                            }

                            // Сбрасываем ставки после расчета результатов
                            resetBets();
                        });
                }, 5000); // Задержка 5 секунд для имитации вращения
            });

        // bot.editMessageReplyMarkup({inline_keyboard: []}, {chat_id, message_id});
    });

    bot.on('callback_query', (callbackQuery) => {
        const {id, message: {chat: {id: chat_id}, message_id}} = callbackQuery;

        if (callbackQuery.data === `spin${chat_id}`) {
            const result = spinRoulette();
            const color = result.color === 'red' ? '' :
                bot.sendDocument(chat_id, message.rouletteSpinner)
                    .then(() => {
                        setTimeout(() => {
                            bot.sendMessage(chat_id, `Результат: ${result.number} (${result.color})`).then(() => {
                                const winners = determineWinners(result);

                                if (winners.length > 0) {
                                    console.log(`winners:`, winners, typeof winners);
                                    let winnersList = winners.reduce((acc, i) => acc += `${i}\n`, '');
                                    console.log(`winners list:`, winnersList, typeof winnersList);
                                    bot.sendMessage(chat_id, `Победители: \n${winner.userId} выиграл ${winner.amount * 2}`)
                                } else {
                                    bot.sendMessage(chat_id, 'К сожалению, никто не выиграл.');
                                }

                                // Сбрасываем ставки после расчета результатов
                                resetBets();
                            });
                        }, 3000);
                    });

            bot.editMessageReplyMarkup({inline_keyboard: []}, {chat_id, message_id});
        }
    });
}*/