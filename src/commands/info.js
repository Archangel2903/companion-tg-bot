const { INFO } = require('../const/commands');

module.exports = (bot) => {
    bot.onText(new RegExp(`${INFO}`, 'gi'), (msg) => {
        console.log('info', msg);
        bot.sendMessage(msg.chat.id, 'Інформація', {parse_mode: 'html'});
    });
}