const https = require('https');
const config = require('../../configuration.json');
const weather_url = `https://api.weatherapi.com/v1/current.json?key={api_key}&q={city}&aqi=no`;

function getWeather(bot) {
    bot.onText(/^\/weather (.+)/, (msg, match) => {
        const {chat: {id: chat_id}} = msg;
        const city = match[1];
        const url = weather_url.replace('{api_key}', config.weather_api_key).replace('{city}', city);

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const weatherData = JSON.parse(data);
                    const msg = `В городе ${weatherData.location.name} сейчас ${weatherData.current.temp_c}°C`;

                    bot.sendMessage(chat_id, msg);
                }
                else {
                    console.error(`Error statusCode: ${res.statusCode}`);
                }
            });
        });
    });
}

module.exports = { getWeather }