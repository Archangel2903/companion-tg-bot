'use strict'
// buffoon_bot
const TelegramBot = require('node-telegram-bot-api');
const config = require('./configuration.json');
const bot = new TelegramBot(config.token, {polling: true});

const {initializeTable} = require('./src/database/db');
const {getWeather} = require('./src/utils/weather');
const {messageListener} = require('./src/users/userManagement');

const {mute, warn} = require('./src/chat/chatManagement');

const {startCommand} = require('./src/commands/start');
const {callAdmins} = require('./src/commands/admins');
const {balance} = require('./src/commands/balance');
const {aliasStart, aliasEnd, aliasRating} = require('./src/commands/alias');
const {roulette, bet, spin} = require('./src/commands/roulete');
const {test} = require('./src/commands/test');

initializeTable();

getWeather(bot);

messageListener(bot);

mute(bot);
warn(bot);
startCommand(bot);
callAdmins(bot);
balance(bot);
aliasStart(bot);
aliasRating(bot);
aliasEnd(bot);
roulette(bot);
bet(bot);
spin(bot);
test(bot);

bot.on('polling_error', (error) => {
    console.error(error);
});