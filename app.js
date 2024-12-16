'use strict'
// buffoon_bot
require('dotenv').config();
const token = process.env.TOKEN;
const weatherApiKey = process.env.WEATHER_API_KEY;

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, {polling: true});

const {initializeTable} = require('./src/database/db');
const {getWeather} = require('./src/commands/weather');
const {messageListener} = require('./src/users/userManagement');

const {mute, warn} = require('./src/chat/chatManagement');

const {startCommand} = require('./src/commands/start');
const {callAdmins} = require('./src/commands/admins');
const {balance} = require('./src/commands/balance');
const {lottery} = require('./src/commands/dice');
const {aliasStart, aliasEnd, aliasRating} = require('./src/commands/alias');
const {roulette, bet, spin} = require('./src/commands/roulete');
const {test} = require('./src/commands/test');

initializeTable();

getWeather(bot, weatherApiKey);

messageListener(bot);

mute(bot);
warn(bot);

startCommand(bot);

callAdmins(bot);

balance(bot);

aliasStart(bot);
aliasRating(bot);
aliasEnd(bot);

lottery(bot);

roulette(bot);
bet(bot);
spin(bot);
test(bot);

bot.on('polling_error', (error) => {
    console.error(error);
});