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
    {number: 11, color: 'red'},
    {number: 12, color: 'black'},
    {number: 13, color: 'red'},
    {number: 14, color: 'black'},
    {number: 15, color: 'red'},
    {number: 16, color: 'black'},
    {number: 17, color: 'red'},
    {number: 18, color: 'black'},
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
    {number: 29, color: 'red'},
    {number: 30, color: 'black'},
    {number: 31, color: 'red'},
    {number: 32, color: 'black'},
    {number: 33, color: 'red'},
    {number: 34, color: 'black'},
    {number: 35, color: 'red'},
    {number: 36, color: 'black'},
];

let bets = [];

function placeBet(user, amount, position) {
    bets.push({user, amount, position});
}

function roulette(bot) {
    bot.onText(/^\/roulette/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;

        bot.sendMessage(chat_id, `Начинаем рулетку.\nДелайте ваши ставки командой /bet ставка, цель ставки (Ч,К,число`, {
            reply_markup: {
                inline_keyboard: [[{
                    text: 'Крутить',
                    callback_data: `spin${chat_id}`,
                }]]
            }
        });

        bot.answerCallbackQuery('callback_data', (callbackQuery) => {
            console.log(callbackQuery);
        });
    });
}

function bet(bot) {
    bot.onText(/\/bet (\d+) (ч|к|\d+)/gi, (msg, match) => {
        const userId = msg.from.id;
        const amount = parseInt(match[1]);
        const position = match[2] === 'ч' ? 'red' : match[2] === 'к' ? 'black' : parseInt(match[2]);

        placeBet(userId, amount, position);
        bot.sendMessage(msg.chat.id, `Ваша ставка принята: ${amount} на ${position}`);
    });
}

function spin(bot) {
    bot.onText(/\/spin/gi, (msg) => {
        const result = spinRoulette();
        const winners = determineWinners(result);

        bot.sendMessage(msg.chat.id, `Результат рулетки: ${result.number} (${result.color})`);
        if (winners.length > 0) {
            winners.forEach(winner => {
                bot.sendMessage(msg.chat.id, `Победитель: ${winner.user} выиграл ${winner.amount * 2}`);
            });
        } else {
            bot.sendMessage(msg.chat.id, 'К сожалению, никто не выиграл.');
        }
    });
}

function spinRoulette() {
    const randomIndex = Math.floor(Math.random() * rouletteNumbers.length);
    const result = rouletteNumbers[randomIndex];
    return result;
}

function determineWinners(result) {
    const winners = bets.filter(bet => {
        if (bet.position === result.number || bet.position === result.color) {
            return true;
        }
        return false;
    });
    return winners;
}


module.exports = { roulette, bet, spin };