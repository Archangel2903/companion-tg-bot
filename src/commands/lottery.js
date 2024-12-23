function lottery(bot) {
    bot.onText(/^\/lottery/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;
        bot.sendDice(chat_id, '🎰');
        // bot.sendMessage(chat_id, ``)

        if ('dice' in msg) {
            const {dice: value} = msg;

            if(value >= 60) {
                bot.sendMessage(chat_id, `Молодец, отличный результат ${value}`);
            }
            else if (value > 44 && value < 60) {
                bot.sendMessage(chat_id, `Молодец, отличный результат ${value}`);
            }
            else if (value > 4 && value < 44) {
                bot.sendMessage(chat_id, `Молодец, хороший ре зультат результат${value}`);
            }
            else {
                bot.sendMessage(chat_id, `${value}, в следующий раз повезёт`);
            }
        }
    });
}

module.exports = { lottery };