'use strict'
// buffoon_bot
require('dotenv').config();
const token = process.env.TOKEN;
const weatherApiKey = process.env.WEATHER_API_KEY;
const creatorId = Number(process.env.CREATOR_ID);

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, {polling: true});

const botCommands = [
    {command: '/start', description: 'Приветственное сообщение.'},
    {command: '/weather [city]', description: 'Узнать погоду в вашем городе.'},
    {command: '/admins', description: 'Позвать администраторов чата сообщением.'},
    {command: '/mute [minutes]', description: 'Запретить пользователю писать на [minutes] в чате.'},
    {command: '/warn', description: 'Дать предупреждение пользователю и запретить писать в чат.'},
    {command: '/balance', description: 'Узнать баланс своего счета.'},
    {command: '/ruleAlias', description: 'Правила игры в Alias.'},
    {command: '/startAlias', description: 'Начать игру в Alias.'},
    {command: '/endAlias', description: 'Завершить игру в Alias.'},
    {command: '/ratingAlias', description: 'Узнать рейтинг игроков в Alias по чату.'},
    {command: '/ruleRoulette', description: 'Правила игры в рулетку.'},
    {command: '/roulette', description: 'Запустить рулетку.'},
];

const {initializeTable} = require('./src/database/db');
const {init} = require('./src/utils/helpers');

const {getWeather} = require('./src/commands/weather');
const {messageListener} = require('./src/users/userManagement');

const {callAdmins} = require('./src/commands/admins');
const {mute, warn} = require('./src/chat/chatManagement');

const {startCommand} = require('./src/commands/start');
const {balance} = require('./src/commands/balance');
const {lottery} = require('./src/commands/lottery');

const {aliasStart, aliasEnd, aliasRating, handleAliasMessage, handleAliasButton} = require('./src/commands/alias');
const {roulette} = require('./src/commands/roulete');
const {test} = require('./src/commands/test');

initializeTable();

getWeather(bot, weatherApiKey);

const commands = [
    messageListener,
    mute,
    warn,
    startCommand,
    callAdmins,
    balance,
    aliasStart,
    aliasEnd,
    aliasRating,
    handleAliasMessage,
    handleAliasButton,
    lottery,
    roulette,
];

init(bot, commands);
test(bot, creatorId);

bot.on('polling_error', (error) => {
    console.error(error);
});