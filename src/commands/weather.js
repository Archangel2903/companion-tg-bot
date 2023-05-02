const { WEATHER } = require('../const/commands');
const { getWeather } = require('../utils/getWeather');

module.exports = (bot) => {
    bot.onText(new RegExp(`${WEATHER} (.+)`, 'gi'), async (msg, match) => {
        const {from: {language_code: lang = 'uk'}, chat: {id}} = msg;
        const city = match[1];
        const weather = await getWeather(city, lang);
        bot.sendMessage(id, weather);
    });
}
