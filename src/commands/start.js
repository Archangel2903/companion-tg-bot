const {START} = require('../const/commands');

module.exports = (bot) => {
    bot.onText(new RegExp(`${START}`, 'gi'), ({from: {first_name}, chat: {id}}) => {
        bot.sendMessage(id, `Привет ${first_name}, приступаем к работе!`);
    });
}