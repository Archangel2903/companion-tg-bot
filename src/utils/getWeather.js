const weather_api_key = process.env.WEATHER_API_KEY;
const axios = require('axios');

// Получение прогноза погоды
async function getWeather(city, lang) {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weather_api_key}&units=metric&lang=${lang === undefined ? 'uk' : lang}`;
    const res = await axios.get(url);
    const data = res.data;
    const weather = data.weather[0].description;
    const temp = data.main.temp;
    return `Погода в городе ${city}: ${weather}, температура ${temp} градусов Цельсия.`;
}

module.exports = {
    getWeather
}