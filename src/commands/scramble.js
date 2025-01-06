const {getRandomWord, isWordInMessage} = require('../commands/alias');

const chatGame = new Map();

function scramble(bot) {
    bot.onText(/^\/scramble/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;

        bot.sendMessage(chat_id, 'Игра в *Scramble*', {
                parse_mode: 'markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{text: '📜 Правила игры 📜', callback_data: 'scramble_rule'}],
                        [{text: 'Начать игру', callback_data: `scramble_start_${chat_id}`}]
                    ]
                }
            }
        )
    });

    bot.on('callback_query', (query) => {
        const { message: {chat: {id: chat_id}}, data } = query;

        switch (data) {
            case 'scramble_rule':
                bot.sendMessage(chat_id, '📜 *Scramble* 📜', {parse_mode: 'markdown'});
                break;

            case `scramble_start_${chat_id}`:
                let randomWord = getRandomWord();
                console.log(randomWord);
                bot.sendMessage(chat_id, shuffleWord(randomWord));
                break;
        }
    });

    bot.on('message', (msg) => {

        /*const guessedWord = match[1].trim().toLowerCase();

        if (guessedWord === currentWord) {
            bot.sendMessage(chatId, 'Поздравляем! Вы угадали слово.');
        } else {
            bot.sendMessage(chatId, 'Неправильно. Попробуйте снова.');
        }*/
    });

    bot.onText(/\/guess (.+)/, (msg, match) => {
        const chatId = msg.chat.id;

    });

}

function shuffleWord(word) {
    return word.toLowerCase().split('').sort(() => 0.5 - Math.random()).join('');
}


module.exports = {scramble};