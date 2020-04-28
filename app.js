// buffoon_bot

const TelegramBot = require('node-telegram-bot-api');
const sqlite = require('sqlite-sync');
// const mtproto = require('telegram-mtproto');
const cfg = require('./config.json');
const token = cfg.token;
const bot = new TelegramBot(token, {polling: true});


sqlite.connect('library.db');
sqlite.run("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL UNIQUE, user_name TEXT NOT NULL, user_nick TEXT UNIQUE, coins_value INTEGER NOT NULL, warns INTEGER NOT NULL)",
    function (res) {
        if (res.error)
            throw res.error;
        // console.log('users ' + res);
    });
sqlite.run("CREATE TABLE IF NOT EXISTS titles(id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL, user_name TEXT NOT NULL, title TEXT NOT NULL UNIQUE, date TEXT NOT NULL)",
    function (res) {
        if (res.error)
            throw res.error;
        // console.log('titles ' + res);
    });
sqlite.run("CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, from_id INTEGER NOT NULL, user_id INTEGER NOT NULL, message_id INTEGER NOT NULL)",
    function (res) {
        if (res.error)
            throw res.error;
        // console.log('messages ' + res);
    });
sqlite.run("CREATE TABLE IF NOT EXISTS times(id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGET NOT NULL UNIQUE, title_time INTEGER, couple_time INTEGER)",
    function (res) {
        if (res.error)
            throw res.error;
        // console.log('times ' + res);
    });

var addMode = {};

// <a href="tg://user?id=123456789">Name</a>

/**
 * /add key
 */
bot.onText(/\/add (.+)/gi, function (msg, match) {
    var userId = msg.from.id;
    var chatId = msg.chat.id;
    var key = match[1];
    var text;
    addMode.chatId = {
        key,
        from: chatId,
        user: userId,
    };

    if (isMessageExists(key)) {
        text = 'Такой ключ уже существует';
    } else {
        text = 'Отправьте мне то, что нужно сохранить или введите /cancel для отмены';
    }

    bot.sendMessage(chatId, text);
});
/**
 * /get key
 */
bot.onText(/\/get (.+)/gi, function (msg, match) {
    var chatId = msg.chat.id;
    var key = match[1];
    var message = getMessage(key);

    if (message.exists) {
        bot.forwardMessage(chatId, message.from_id, message.message_id);
    }
});
/**
 * remove key
 */
bot.onText(/\/remove (.+)/gi, function (msg, match) {
    var chatId = msg.chat.id;
    var key = match[1];
    var message = getMessage(key);

    if (!message.exists) return;
    if (message.from_id != msg.chat.id) return;

    sqlite.delete('messages', {"key": key}, function () {
        bot.sendMessage(chatId, 'Значение ' + key + ' успешно удаленно');
    });
});
/**
 * /list
 */
bot.onText(/\/list/gi, function (msg) {
    var userId = msg.from.id;
    var chatId = msg.chat.id;
    var data = sqlite.run("SELECT `key` FROM messages WHERE `user_id` = ?", [userId]);

    if (data.length == 0) {
        bot.sendMessage(chatId, 'Ничего не добавлено');
        return;
    }

    var lines = [];
    data.forEach(function (element) {
        lines.push('`' + element.key + '`');
    });
    bot.sendMessage(chatId, lines.join(', '), {parse_mode: 'markdown'});
});

// Bot commands
/**
 * /start
 */
bot.onText(/\/start/gi, function (msg) {
    var userId = msg.from.id;
    var userName = msg.from.first_name;
    var userNick;
    var chatId = msg.chat.id;

    if (!isUserExists(userId)) {
        if ('username' in msg.from) {
            userNick = msg.from.username;
        }

        addUser(userId, userName, chatId, userNick);
    }

    bot.sendMessage(chatId, 'Привет <a href="tg://user?id=' + userId + '">' + userName + '</a>', {parse_mode: 'html'});
});
/**
 * /admins
 */
bot.onText(/\/admins|^админы/gi, function (msg) {
    if (msg.chat.type !== 'private') {
        var chatId = msg.chat.id;

        callAdmins(chatId);
    }
});
/**
 * /balance
 */
bot.onText(/\/balance|^баланс$|^б$/gi, function (msg) {
    var userId = msg.from.id;
    var userName = msg.from.first_name;
    var chatId = msg.chat.id;
    var data_coins = sqlite.run("SELECT coins_value FROM users WHERE user_id = ?", [userId])[0].coins_value;
    var textMsg = userName + ', на твоём счету:\n💰' + data_coins + '💰';
    console.log('/balance');

    bot.sendMessage(chatId, textMsg);
});
/**
 * /chat_title
 */
bot.onText(/\/chat_title (.+)/gi, function (msg, match) {
    var userId = msg.from.id;
    var userName = msg.from.first_name;
    var chatId = msg.chat.id;
    var text = match[1];

    bot.getChatMember(chatId, userId).then(function (data) {
        let status = data.status;

        if (status === 'creator' || status === 'administrator') {
            bot.setChatTitle(chatId, text);
        } else {
            bot.sendMessage(chatId, '<a href="tg://user?id=' + userId + '">' + userName + '</a>, ты не администратор', {parse_mode: 'html'});
        }
    });
});

// Listener messages
bot.on('message', function (msg) {
    var userId = msg.from.id;
    var userName = msg.from.first_name;
    var userNick;
    var chatId = msg.chat.id;
    var chatTitle = msg.chat.title;
    var row = addMode.chatId;

    if (!isUserExists(userId)) {
        if ("username" in msg.from) {
            userNick = msg.from.username;
            console.log(userNick);
        }
        addUser(userId, userName, chatId, userNick);
    }
    if ('new_chat_participant' in msg) {
        var newUserId = msg.new_chat_participant.id;
        var newUserName = msg.new_chat_participant.first_name;
        var newUserNick = msg.new_chat_participant.username;

        if (!isUserExists(newUserId)) {
            if ("username" in msg.from) {
                userNick = msg.from.username;
                console.log(newUserNick);
            }
            addUser(newUserId, newUserName, chatId, userNick);
        }

        bot.getChatAdministrators(chatId).then(function (data) {
            var creatorId;

            data.forEach(function (i) {
                if (i.status === 'creator') {
                    creatorId = i.user.id;
                }
            });

            bot.sendMessage(creatorId, '👍🏻 В чат ' + chatTitle + ' вошёл новый пользователь <a href="tg://user?id=' + newUserId + '">' + newUserName + '</a> 👍🏻', {parse_mode: 'html'});
        });
        bot.sendMessage(chatId, '🙂 Добро пожаловать <a href="tg://user?id=' + newUserId + '">' + newUserName + '</a> 🙂', {parse_mode: 'html'});
    }
    if ('left_chat_participant' in msg) {
        var leftUserId = msg.left_chat_participant.id;
        var leftUserName = msg.left_chat_participant.first_name;
        // var leftUserNick = msg.left_chat_participant.username;

        bot.getChatAdministrators(chatId).then(function (data) {
            var creatorId;

            data.forEach(function (i) {
                if (i.status == 'creator') {
                    creatorId = i.user.id;
                }
            });

            bot.sendMessage(creatorId, '👎🏻 Из чата ' + chatTitle + ' вышел пользователь <a href="tg://user?id=' + leftUserId + '">' + leftUserName + '</a> 👎🏻', {parse_mode: 'html'});
        });
        bot.sendMessage(chatId, '🙁 Прощай <a href="tg://user?id=' + leftUserId + '">' + leftUserName + '</a> 🙁', {parse_mode: 'html'});
    }

    if (typeof(msg.text) !== 'undefined' && (msg.text.toLowerCase() === '/cancel' || msg.text.toLowerCase() === '/cancel@bb_funny_bot')) {
        delete addMode.chatId;
        return;
    }
    if ("chatId" in addMode) {
        sqlite.insert("messages", {key: row.key, from_id: row.from, user_id: row.user, message_id: msg.message_id}, function (res) {
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
    }
    else {
        return;
    }
});

// Титул дня (ГОТОВО)
bot.onText(/^!(.+) дня$/gi, function (msg, match) {
    var chatId = msg.chat.id;
    var text = match[1];
    var usersChat = sqlite.run("SELECT * FROM users WHERE `chat_id` = ?", [chatId]);
    var random = Math.round(Math.random() * usersChat.length - 1);
    var rndUserId = usersChat[random].user_id;
    var rndUserName = usersChat[random].user_name;
    var noteTime = sqlite.run("SELECT `title_time` FROM times WHERE `chat_id` = ? ", [chatId]);
    var time = Date.now();
    var date = new Date().getDate() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getFullYear();

    if (text === 'пара') return false;

    if (noteTime.length) {
        var prevTime = noteTime[0].title_time;

        if ((prevTime + 3600000) <= time) {
            sqlite.insert("titles", {chat_id: chatId, user_id: rndUserId, user_name: rndUserName, title: text, date: date});
            sqlite.run("UPDATE times SET `title_time` = ? WHERE `chat_id` = ?", [time, chatId]);
            bot.sendMessage(chatId, text + ' дня у нас <a href="tg://user?id=' + rndUserId + '">' + rndUserName + '</a>', {parse_mode: 'html'});
        }
        else {
            bot.sendMessage(chatId, '🤖Выбрать титул дня можно раз в час🤖');
        }
    }
    else {
        sqlite.insert("times", {chat_id: chatId, title_time: time});
        sqlite.insert("titles", {chat_id: chatId, user_id: rndUserId, user_name: rndUserName, title: text, date: date});
        bot.sendMessage(chatId, text + ' дня у нас <a href="tg://user?id=' + rndUserId + '">' + rndUserName + '</a>', {parse_mode: 'html'});
    }
});
// Список титулов дня (ГОТОВО)
bot.onText(/\/titles|^!титулы/gi, function (msg) {
    var chatId = msg.chat.id;
    var date = new Date().getDate() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getFullYear();
    var titlesData = sqlite.run("SELECT * FROM titles WHERE `chat_id` = ?", [chatId]);
    var titlesList = [];
    console.log('Список титулов');

    titlesData.forEach(function (item) {
        if (item.date == date) {
            titlesList.push('👤' + item.user_name + ' - ' + item.title + ' дня👑');
        }
    });

    bot.sendMessage(chatId, '🤖<b>Титулы дня</b>🤖\n\n' + titlesList.join('\n'), {parse_mode: 'html'});
});
// Отдать монетки (ГОТОВО)
bot.onText(/^\+(\d+)$/, function (msg, match) {
    if ("reply_to_message" in msg) {
        var userId = msg.from.id;
        var userName = msg.from.first_name;
        var chatId = msg.chat.id;
        var coinsVal = Number(match[1]);
        var userCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [userId])[0].coins_value);
        var result;
        var replyId = msg.reply_to_message.from.id;
        var replyName = msg.reply_to_message.from.first_name;
        var replyCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [replyId])[0].coins_value);

        if (userId == replyId) {
            return;
        }

        if (userCoins < coinsVal) {
            bot.sendMessage(chatId, userName + ', нельзя отдать больше чем имеешь☝🏻');
            return;
        }
        else {
            result = userCoins - coinsVal;
            sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [result, userId]);
        }

        result = replyCoins + coinsVal;
        sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [result, replyId]);

        bot.sendMessage(chatId, userName + ' отдал 💰' + coinsVal + '💰\n' + replyName + ' итого у тебя 💰' + result + '💰', {parse_mode: 'html'});
    }
});
bot.onText(/^\+$|^спасибо$/, function (msg) {
    if ("reply_to_message" in msg) {
        var userId = msg.from.id;
        var userName = msg.from.first_name;
        var chatId = msg.chat.id;
        var userCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [userId])[0].coins_value);
        var replyId = msg.reply_to_message.from.id;
        var replyName = msg.reply_to_message.from.first_name;
        var replyCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [replyId])[0].coins_value);
        var result;

        if (userId == replyId) {
            return;
        }
        else if (userCoins <= 0) {
            bot.sendMessage(chatId, userName + ', нельзя отдать больше чем имеешь☝🏻');
            return;
        }
        else {
            result = userCoins - 1;
            sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [result, userId]);
        }

        result = replyCoins + 1;
        sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [result, replyId]);
        bot.sendMessage(chatId, userName + ' поделился монеткой 💰1💰\n' + replyName + ' у тебя 💰' + result + '💰', {parse_mode: 'html'});
    }
});
// Отнять монетки (ГОТОВО)
bot.onText(/^-(\d+)$/, function (msg, match) {
    if ("reply_to_message" in msg) {
        var userId = msg.from.id;
        var userName = msg.from.first_name;
        var userCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [userId])[0].coins_value);
        var chatId = msg.chat.id;
        var coinsVal = Number(match[1]);
        var replyId = msg.reply_to_message.from.id;
        var replyName = msg.reply_to_message.from.first_name;
        var replyCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [replyId])[0].coins_value);
        var chance = randomTo(10);
        var stolenCoins = randomTo(coinsVal);
        var resultMinus;
        var resultPlus;
        var text = '';

        if (userId == replyId) {
            return;
        }

        if (replyId == +cfg.creator_id) {
            bot.sendMessage(chatId, userName + ' не смог отнять 💰монеты💰 у ' + replyName);
            return;
        }

        if (Math.floor(replyCoins / 2) < coinsVal) {
            bot.sendMessage(chatId, userName + ', нельзя отнимать больше 50%');
            return;
        }
        else if (chance > Math.floor(10 / 3)) {
            resultMinus = replyCoins - stolenCoins;
            resultPlus = userCoins + stolenCoins;
            sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [resultMinus, replyId]);
            sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [resultPlus, userId]);
            text = userName + ' отнял 💰' + stolenCoins + '💰\n' + replyName + ' у тебя осталось 💰' + resultMinus + '💰';
        }
        else {
            text = userName + ' не смог отнять 💰монеты💰 у ' + replyName;
        }
        bot.sendMessage(chatId, text);
    }
});
// Розыгрыш монеток (В ПРОЦЕССЕ)
bot.onText(/^!розыгрыш (\d+)$/gi, function (msg, match) {
    var userId = msg.from.id;
    var chatId = msg.chat.id;
    var prize = Number(match[1]);
    var buttons = {
        reply_markup: {
            inline_keyboard: options.raffleStart.buttons
        }
    }
    console.log(userId, chatId, prize);
    // СДЕЛАТЬ ЗАПИСЬ НА УЧАСТИЕ В РОЗЫГРЫШЕ С КНОПКАМИ
    // ПЕРЕЗАПИСЫВАЮЩЕЕСЯ СООБЩЕНИЕ

    bot.sendMessage(chatId, 'Разыгрывается ' + prize + ' монет', buttons);
});
// Мут за монетки (ГОТОВО)
bot.onText(/^!мут$/gi, function (msg) {
    if ("reply_to_message" in msg) {
        var userId = msg.from.id;
        var userName = msg.from.first_name;
        var chatId = msg.chat.id;
        var userCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [userId])[0].coins_value);
        var replyId = msg.reply_to_message.from.id;
        var replyName = msg.reply_to_message.from.first_name;
        var time = msg.date + (0.55 * 60);
        var result = userCoins - 50;
        var textMsg = '';

        console.log('мут за монетки');

        // if (userId == replyId) return

        bot.getChatMember(chatId, replyId).then(function (data) {
            let status = data.status;

            if (status === 'administrator' || status === 'creator') {
                textMsg = '🤖Нельзя дать мут Администратору🤖';
                // console.log('Пользователь не может дать мут АДМИНУ');
            }
            else if (status === 'restricted') {
                textMsg = replyName + ' уже молчит🙊';
                // console.log('Пользователь уже молчит');
            }
            else if (userId === +cfg.creator_id) {
                textMsg = replyName + ', получил(а) мут🙊';
                bot.restrictChatMember(chatId, replyId, {can_send_message: false, until_date: time});
                // console.log('Создатель заткнул наглеца');
            }
            else if (userCoins >= 50 && randomTo(10) > 10 / 3) {
                textMsg = replyName + ', получил(а) мут🙊';
                bot.restrictChatMember(chatId, replyId, {can_send_message: false, until_date: time});
                sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [result, userId]);
                // console.log('Пользователь дал мут другому пользователю');
            }
            else {
                textMsg = userName + ', не смог заткнуть ' + replyName + '😋';
                // console.log('Пользователь НЕ смог дать мут');
            }

            bot.sendMessage(chatId, textMsg);
        });
    }
});
// Мут для администраторов (ГОТОВО)
bot.onText(/^!!мут (\d+)$/gi, function (msg, match) {
    if ("reply_to_message" in msg) {
        let userId = msg.from.id;
        let chatId = msg.chat.id;
        let replyId = msg.reply_to_message.from.id;
        let replyName = msg.reply_to_message.from.first_name;
        let value = Number(match[1]);
        let time = msg.date + (value * 60);
        let textMsg = '';
        let minutes = value === 1 ? ' минуту' : value > 4 ? ' минут' : ' минуты';

        bot.getChatMember(chatId, userId).then(function (data) {
            let status = data.status;
            if (status === 'creator' || status === 'administrator') {
                textMsg = replyName + ', получил(а) мут на ' + value + minutes + '🙊';
                bot.restrictChatMember(chatId, replyId, {can_send_message: false, until_date: time});
                bot.sendMessage(chatId, textMsg);
                console.log('Администратор дал мут на ' + value + minutes);
            } else return false;
        });
    }
});
// Пара дня (ГОТОВО)
bot.onText(/^!пара$/gi, function (msg) {
    var chatId = msg.chat.id;
    var noteTime = sqlite.run("SELECT `couple_time` FROM times WHERE chat_id = ? ", [chatId]);
    var users = sqlite.run("SELECT * FROM users WHERE `chat_id` = ?", [chatId]);
    var user1 = users[randomTo(users.length)];
    var user2 = users[randomTo(users.length)];
    var time = Date.now();

    if (noteTime.length) {
        var prevTime = noteTime[0].couple_time;

        if ((prevTime + 3600000) <= time) {
            sqlite.run("UPDATE times SET `couple_time` = ? WHERE `chat_id` = ?", [time, chatId]);
            bot.sendMessage(chatId, '🤖Пара дня🤖\n\n🌚<a href="tg://user?id=' + user1.user_id + '">' + user1.user_name + '</a>🌝\n❤👆🏻❤👇🏻❤\n🌚<a href="tg://user?id=' + user2.user_id + '">' + user2.user_name + '</a>🌝', {parse_mode: 'html'});
        }
        else {
            bot.sendMessage(chatId, '🤖Выбрать пару дня можно раз в час🤖');
        }
    }
    else {
        sqlite.insert("times", {chat_id: chatId, couple_time: time});
        bot.sendMessage(chatId, '🤖Пара дня🤖\n\n🌚<a href="tg://user?id=' + user1.user_id + '">' + user1.user_name + '</a>🌝\n❤👆🏻❤👇🏻❤\n🌚<a href="tg://user?id=' + user2.user_id + '">' + user2.user_name + '</a>🌝', {parse_mode: 'html'});
    }
});

/* ******************************************** */

// Случайное число
bot.onText(/^!р$/gi, function (msg) {
    var chatId = msg.chat.id;
    var num;
    // var random = Math.floor((Math.random() * 10) + 1);
    /*
        for (var i = 0; i <= 5; i++) {
            bot.sendMessage(chatId, randomTo(12));
        }
    */

    var random = setInterval(function () {
        num = randomTo(12);
        console.log(num);
        bot.sendMessage(chatId, num);
    }, 1000);
    setTimeout(function () {
        console.log('interval is clear');
        clearInterval(random);
    }, 5500);


    // bot.sendMessage(chatId, randomTo(12));
});
// пентаграмма
bot.onText(/^!(пентаграмма)$/gi, function (msg) {
    var userId = msg.from.id;
    var whiteUser = 414108177;
    var chatId = msg.chat.id;
    var stick = 'CAACAgIAAx0CVDUeagACCEpejnCzJitQCQkv6prUYsH7LO0-ygACMAADEcquGJqJ0BWxB0duGAQ';

    if (userId === whiteUser || userId === +cfg.creator_id) bot.sendSticker(chatId, stick);
});

var options = {
    testBtn: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Титул дня', callback_data: 'титул'}],
                [{text: 'Пара дня', callback_data: 'пара'}],
                [{text: 'Позвать администраторов', callback_data: 'админы'}]
            ]
        })
    },
    raffleStart: {
        text: 'Что бы принять участие в розыгрыше, нажмите кнопку',
        buttons: [
            [{text: 'Учавствовать в розыгрыше', callback_data: 'розыгрыш'}]
        ]
    }
};

bot.onText(/\/test/gi, function (msg) {
    let userId = msg.from.id;
    let chatId = msg.chat.id;
    console.log('/test');
    console.groupCollapsed();

    // bot.sendDice(chatId);
    // bot.sendMessage(chatId, 'Функции бота🎲', options.testBtn);

    console.log(msg);

    bot.getMe(chatId).then(function (data) {
        console.log(data);
        console.group();
    });
    bot.getChatMember(chatId, userId).then(function (data) {
        console.log('\n');
        console.log(data);
        console.group();
    });
    bot.getChat(chatId).then(function (data) {
        console.log('\n');
        console.log(data);
        console.groupEnd();
        console.groupEnd();
    });

    userUpdate(userId);
});
bot.on('callback_query', function (msg) {
    var chatId = msg.message.chat.id;
    var data = msg.data;

    if (data === 'титул') {
        console.log('data: ' + data);
        var getTitles = sqlite.run("SELECT `title` FROM titles");
        var title = getTitles[randomTo(getTitles.length)].title;
        var getUsers = sqlite.run("SELECT * FROM users WHERE `chat_id` = ?", [chatId]);
        var randomUser = getUsers[randomTo(getUsers.length)];
        var randomUser_id = randomUser.user_id;
        var randomUser_name = randomUser.user_name;

        bot.sendMessage(chatId, title + ' дня - ' + randomUser_name);
        // bot.sendMessage(chatId, title + ' дня - <a href="tg://user?id=' + randomUser_id + '">' + randomUser_name + '</a>', {parse_mode: 'html'});
    }
    else if (data === 'пара') {
        console.log('data: ' + data);
    }
    else if (data === 'админы') {
        console.log('data: ' + data);

        callAdmins(chatId);
    }
    else if (data === 'розыгрыш') {
        console.log('data: ' + data);
    }
});

// Functions
function isUserExists(uId) {
    return sqlite.run("SELECT COUNT(*) as cnt FROM users WHERE `user_id` = ?", [uId])[0].cnt != 0;
}

function isMessageExists(key) {
    return sqlite.run("SELECT COUNT(*) as cnt FROM messages WHERE `key` = ?", [key])[0].cnt != 0;
}

function getMessage(key) {
    const data = sqlite.run("SELECT * FROM messages WHERE `key` = ? LIMIT 1", [key]);

    if (data.length == 0) {
        return {exists: false};
    }
    data[0].exists = true;
    return data[0];
}

function randomTo(n) {
    return Math.floor(Math.random() * n);
}

function callAdmins(cId) {
    bot.getChatAdministrators(cId).then(function (data) {
        var admins = [];

        data.forEach(function (elem) {
            admins.push('<a href="tg://user?id=' + elem.user.id + '">' + elem.user.first_name + '</a>');
        });

        bot.sendMessage(cId, admins.join(', '), {parse_mode: 'html'});
    });
}

function addUser(uId, uName, cId) {
    console.log('New user - ' + uName + ' - ' + arguments["3"]);
    sqlite.insert("users", {user_id: uId, user_name: uName, user_nick: arguments["3"], chat_id: cId, coins_value: 1000, warns: 0}, function (res) {
        if (res.error) {
            throw res.error;
        }
    });
}

function isChat(cId) {

}

function userUpdate(uId) {
    var user = sqlite.run("SELECT * FROM users WHERE `user_id` = ?", [uId]);

    console.log(user);
}