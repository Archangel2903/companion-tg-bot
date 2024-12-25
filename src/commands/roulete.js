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

        console.log(`position`, position, typeof position);

        switch (position) {
            case 'red':
                textMessage = `Ваша ставка принята: ${amount} на ${message.red}`;
                break;
            case 'black':
                textMessage = `Ваша ставка принята: ${amount} на ${message.black}`;
                break;
            case 0:
                textMessage = `Ваша ставка принята: ${amount} на ${position}${message.green}`;
                break;
            default:
                textMessage = `Ваша ставка принята: ${amount} на ${position}${message}`;
                break;
        }

        if (gameState.openBets) {
            takeUserCoins(user_id, amount);
            bet(gameState, {'firstname': first_name, 'user_id': user_id, 'amount': amount, 'position': position});
            bot.sendMessage(chat_id, textMessage);
        }
        else {
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
                }, 6000);
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