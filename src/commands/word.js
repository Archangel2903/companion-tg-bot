const { WORD } = require('../const/commands');

module.exports = (bot) => {
    bot.onText(new RegExp(`${WORD}`, 'gi'), (msg) => {
        console.log(msg.from.first_name, 'word game');
    });
}