'use strict'

const ENV = require('dotenv').config();
const openai_key = process.env.OPENAI_KEY;
const bot_token = process.env.BOT_TOKEN;
const weather_api_key = process.env.WEATHER_API_KEY;
const creator_id = process.env.CREATOR_ID;

const telegram_bot = require('node-telegram-bot-api');
const sqlite = require('sqlite-sync');
const axios = require('axios');
const CronJob = require('cron').CronJob;
const {Configuration, OpenAIApi} = require("openai");

const configuration = new Configuration({
    apiKey: openai_key,
});
const openai = new OpenAIApi(configuration);
const bot = new telegram_bot(bot_token, {polling: true});

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});

const {getWeather} = require('./src/utils/getWeather');
const command_action = {
    openai_handler: true,
    listenerCMD: require('./src/commands/listener'),
    startCMD: require('./src/commands/start'),
    weatherCMD: require('./src/commands/weather'),
    wordCMD: require('./src/commands/word'),
    infoCMD: require('./src/commands/info'),
    testCMD: require('./src/commands/test'),
    command_init: function () {
        this.listenerCMD(bot);
        this.startCMD(bot);
        this.weatherCMD(bot);
        this.wordCMD(bot);
        this.infoCMD(bot);
        this.testCMD(bot);
    },
}
command_action.command_init();

sqlite.connect('smartBot.db');
sqlite.run("CREATE TABLE IF NOT EXISTS users(id INTEGER NOT NULL UNIQUE, name TEXT NOT NULL, username TEXT, coins_value INTEGER NOT NULL)",
    function (res) {
        if (res.error) throw res.error;
        // console.log('users ' + res);
    });
sqlite.run("CREATE TABLE IF NOT EXISTS chat(id INTEGER NOT NULL, lang TEXT NOT NULL, users INTEGER NOT NULL)",
    function (res) {
        if (res.error)
            throw res.error;
        // console.log('titles ' + res);
    });
sqlite.run("CREATE TABLE IF NOT EXISTS warns(user_id INTEGER NOT NULL UNIQUE, chat_id INTEGER NOT NULL UNIQUE, warn_star INTEGER, warn_end INTEGER)",
    function (res) {
        if (res.error)
            throw res.error;
        // console.log('times ' + res);
    });
sqlite.close();

//GPT
bot.onText(new RegExp('^!\(.+\)', 'gi'), async (msg, match) => {
    if (command_action.openai_handler) {
        command_action.openai_handler = false;
        const chatId = msg.chat.id;
        const text = match[1];

        console.log(`${msg.from.first_name}: Спрашивает "${match[1]}"`);

        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: text,
            temperature: 1,
            max_tokens: 500,
            n: 1,
            stop: '.',
        });

        bot.sendMessage(chatId, response.data.choices[0].text.trim(), {parse_mode: 'html'}).then(() => {
            setTimeout(() => {
                command_action.openai_handler = true;
            }, 1000);
        });
    }
});

// Создаем задачу для напоминания каждый день в 9 утра
const job = new CronJob('0 9 * * *', async function () {
    const chatId = '-1001902435375';
    const city = 'Ужгород';
    const lang = 'uk';
    const weatherMsg = await getWeather(city, lang);

    // bot.sendMessage(chatId, '<a href="tg://user?id=774264924">Маx</a> ', {parse_mode: 'html'});
    bot.sendMessage(chatId, weatherMsg);
}, null, true, 'Europe/Kiev');

// Запускаем задачу
job.start();

// process.exit();