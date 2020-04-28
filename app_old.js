/*
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
*/

const TelegramBot = require('node-telegram-bot-api'); // Подключаем библиотеку для работы с Telegram API в переменную
const sqlite = require('sqlite-sync');
const token = '1231828397:AAHZTLJ06CfQGDyf_S3bOfgxw3brSmij9zM'; // Устанавливаем токен, который выдавал нам бот
const bot = new TelegramBot(token, {polling: true});

sqlite.connect('library.db');
sqlite.run("CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, from_id INTEGER NOT NULL, message_id INTEGER NOT NULL);", function (res) {
    if (res.error)
        throw res.error;
    console.log(res);
});

var titles = [];
var addMode = {};

/**
 * /get hello
 */
bot.onText(/\/get (.+)/, function (msg, match) {
    var chatId = msg.chat.id;
    var key = match[1];
    var message = getMessage(key);

    if (message.exists) {
        bot.forwardMessage(chatId, message.from_id, message.message_id);
    }
});
/**
 * /add [key]
 */
bot.onText(/\/add (.+)/, function (msg, match) {
    var chatId = msg.chat.id;
    var key = match[1];
    var text;
    addMode.chatId = {
        key,
        from: chatId,
    };

    if (isMessageExists(key)) {
        text = 'Такой ключ уже существует';
    } else {
        text = 'Отправьте мне то, что нужно сохранить';
    }
    bot.sendMessage(chatId, text);
});
bot.on('message', function (msg) {
    var chatId = msg.chat.id;
    var row = addMode.chatId;

    if (!("chatId" in addMode)) {
        return;
    }

    sqlite.insert("messages", {key: row.key, from_id: row.from, message_id: msg.message_id}, function (res) {
        var text;
        if (res.error) {
            text = 'Добавить не получилось';
            throw res.error;
        } else {
            text = 'Сообщение добавлено';
        }

        bot.sendMessage(chatId, text);
        delete addMode.chatId;
    });
});

function isMessageExists(key) {
    return sqlite.run("SELECT COUNT(*) as cnt FROM messages WHERE key = ?", [key])[0].cnt != 0;
}
function getMessage(key) {
    const data = sqlite.run("SELECT * FROM messages WHERE key = ? LIMIT 1", [key]);

    if (data.length == 0) {
        return {exists: false};
    }
    data[0].exists = true;
    return data[0];
}












/*bot.onText(/!(.+) дня/, function (msg, match) {
    var chatId = msg.chat.id;
    var text = match[1] + ' дня';

    titles.push(match[1]);

    console.log(msg);
    bot.sendMessage(chatId, text);
});*/

/*bot.onText(/\/echo/, function (msg, match) {
    var chatId = msg.chat.id;

    clearInterval(timer);

    var timer = setInterval(function () {
        var r = Math.floor(Math.random() * titles.length);
        bot.sendMessage(chatId, '!' + titles[r] + ' дня');
    }, 3000);
});*/

/*
bot.on('message', function (msg) {
    var chatId = msg.chat.id; // Берем ID чата (не отправителя)
    // Фотография может быть: путь к файлу, поток (stream) или параметр file_id
    var photo = 'cats.png'; // в папке с ботом должен быть файл "cats.png"
    bot.sendPhoto(chatId, photo, { caption: 'Милые котята' });
});*/