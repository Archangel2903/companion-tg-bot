// buffoon_bot
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.json');
const token = config.token;
const bot = new TelegramBot(token, {polling: true});
const sqlite = require('sqlite-sync');


sqlite.connect('library.db');
sqlite.run("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL UNIQUE, user_name TEXT NOT NULL, user_nick TEXT UNIQUE, coins_value INTEGER NOT NULL, warns INTEGER NOT NULL)",
    function (res) {
        if (res.error)
            throw res.error;
        // console.log('users ' + res);
    });
sqlite.run("CREATE TABLE IF NOT EXISTS titles(id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL, user_name TEXT NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL)",
    function (res) {
        if (res.error)
            throw res.error;
        // console.log('titles ' + res);
    });
sqlite.run("CREATE TABLE IF NOT EXISTS times(id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGET NOT NULL UNIQUE, title_time INTEGER, couple_time INTEGER)",
    function (res) {
        if (res.error)
            throw res.error;
        // console.log('times ' + res);
    });

const options = {
    testBtn: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Титул дня', callback_data: 'титул'}],
                [{text: 'Пара дня', callback_data: 'пара'}],
                [{text: 'Позвать администраторов', callback_data: 'админы'}],
                [{text: '🌳🌲➡ ЛЕС ⬅🌲🌳', url: 'https://t.me/forest_chat', callback_data: 'forest'}]
            ]
        })
    },
    forestBtn: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: '🌳🌲➡ ЛЕС ⬅🌲🌳', url: 'https://t.me/forest_chat'}]
            ]
        })
    },
    raffleStart: {
        text: 'Что бы принять участие в розыгрыше, нажмите кнопку',
        buttons: [
            [{text: 'Учавствовать в розыгрыше', callback_data: 'raffle_start'}]
        ]
    }
};
const daun = 1128150776;
const hui = ['ЛОХ', 'иди на хуй', 'присел на бутылку', 'ФУ!!!', 'АтсАси', 'олигафрен', 'чмошник', 'https://natribu.org/', 'очкошник', 'калл', 'даёт за пивас'];

// <a href="tg://user?id=123456789">Name</a>

// Bot commands
/* /start */
bot.onText(/\/start/gi, (msg) => {
    if (msg.chat.type === 'private') {
        let userId = msg.from.id;
        let userName = msg.from.first_name;
        let userNick;
        let chatId = msg.chat.id;

        if (!isUserExists(userId)) {
            if ('username' in msg.from) {
                userNick = msg.from.username;
            }

            addUser(userId, userName, chatId, userNick);
        }

        bot.sendMessage(chatId, 'Привет <a href="tg://user?id=' + userId + '">' + userName + '</a>', {parse_mode: 'html'});
    }
});

/* /admins */
bot.onText(/\/admins|^админы/gi, (msg) => {
    if (msg.chat.type !== 'private') callAdmins(msg.chat.id);
});

/* /balance */
bot.onText(/\/balance|^баланс$|^б$/gi, function (msg) {
    let userId = msg.from.id;
    let userName = msg.from.first_name;
    let chatId = msg.chat.id;
    let data_coins = sqlite.run("SELECT coins_value FROM users WHERE user_id = ?", [userId])[0].coins_value;
    let textMsg = userName + ', на твоём счету:\n💰' + data_coins + '💰';
    console.log('/balance');

    bot.sendMessage(chatId, textMsg);
});

/* Listener messages */
bot.on('message', function (msg) {
    let userId = msg.from.id;
    let userName = msg.from.first_name;
    let userNick;
    let chatId = msg.chat.id;

    console.log(userName + ' - ' + userId);

    if (userId === 1128150776 || userId === 1210351347) {
        let nh = randomTo(hui.length - 1);

        bot.sendMessage(chatId, '<a href="tg://user?id='+ userId +'">Алёша</a>, ' + hui[nh], {parse_mode: 'html'});
    }

    if (!isUserExists(userId)) {
        if ("username" in msg.from) {
            userNick = msg.from.username;
            console.log(userNick);
        }
        addUser(userId, userName, chatId, userNick);
    }

    /************************************************************************/
    let chatTitle = msg.chat.title;
    /*if ('new_chat_participant' in msg || 'new_chat_member' in msg) {
        console.log(msg);
        var newUserId = msg.new_chat_member.id;
        var newUserName = msg.new_chat_member.first_name;
        var newUserNick = msg.new_chat_member.username;

        if (!isUserExists(newUserId)) {
            if ("username" in msg.from) {
                userNick = msg.from.username;
                console.log(newUserNick);
            }
            addUser(newUserId, newUserName, chatId, userNick);
        }

        bot.getChatAdministrators(chatId).then(function (data) {
            var creatorId = +config.creator_id;

            data.forEach(function (i) {
                if (i.status === 'creator') {
                    creatorId = i.user.id;
                }
                else if (i.status === 'administrator') {
                    var admId = i.user.id;
                    bot.sendMessage(admId, '👍🏻 В чат ' + chatTitle + ' вошёл новый пользователь <a href="tg://user?id=' + newUserId + '">' + newUserName + '</a> 👍🏻', {parse_mode: 'html'});
                }
            });

            /!*bot.sendMessage(+config.creator_id, '👍🏻 В чат ' + chatTitle + ' вошёл новый пользователь <a href="tg://user?id=' + newUserId + '">' + newUserName + '</a> 👍🏻', {parse_mode: 'html'});*!/
            bot.sendMessage(creatorId, '👍🏻 В чат ' + chatTitle + ' вошёл новый пользователь <a href="tg://user?id=' + newUserId + '">' + newUserName + '</a> 👍🏻', {parse_mode: 'html'});
        });

        bot.sendMessage(chatId, '🙂 Добро пожаловать <a href="tg://user?id=' + newUserId + '">' + newUserName + '</a> 🙂', {parse_mode: 'html'});
    }
    else if ('left_chat_participant' in msg || 'left_chat_member' in msg) {
        console.log(msg);
        var leftUserId = msg.left_chat_member.id;
        var leftUserName = msg.left_chat_member.first_name;

        bot.getChatAdministrators(chatId).then(function (data) {
            var creatorId = Number(config.creator_id);

            data.forEach(function (i) {
                bot.sendMessage(i.user.id, '👎🏻 Из чата ' + chatTitle + ' вышел пользователь <a href="tg://user?id=' + leftUserId + '">' + leftUserName + '</a> 👎🏻', {parse_mode: 'html'});

                /!*if (i.status === 'creator') {
                    creatorId = i.user.id;
                }*!/
            });

            bot.sendMessage(creatorId, '👎🏻 Из чата ' + chatTitle + ' вышел пользователь <a href="tg://user?id=' + leftUserId + '">' + leftUserName + '</a> 👎🏻', {parse_mode: 'html'});
        });

        bot.sendMessage(chatId, '🙁 Прощай <a href="tg://user?id=' + leftUserId + '">' + leftUserName + '</a> 🙁', {parse_mode: 'html'});
    }*/
});
bot.on('new_chat_members', (msg) => newMember(msg));
bot.on('left_chat_member', function (msg) {
    let userId = msg.from.id;
    let userName = msg.from.first_name;
    let userNick;
    let chatId = msg.chat.id;
    let chatTitle = msg.chat.title;

    bot.getChatAdministrators(chatId).then(function (data) {
        let creatorId = +config.creator_id;

        data.forEach(function (i) {
            if (i.status === 'creator') {
                creatorId = i.user.id;
            }
            else if (i.status === 'administrator') {
                bot.sendMessage(i.user.id, '👎🏻 Из чата ' + chatTitle + ' вышел пользователь <a href="tg://user?id=' + userId + '">' + userName + '</a> 👎🏻', {parse_mode: 'html'});
            }
        });

        bot.sendMessage(creatorId, '👎🏻 Из чата ' + chatTitle + ' вышел пользователь <a href="tg://user?id=' + userId + '">' + userName + '</a> 👎🏻', {parse_mode: 'html'});
    });

    bot.sendMessage(chatId, '🙁 Прощай <a href="tg://user?id=' + userId + '">' + userName + '</a> 🙁', {parse_mode: 'html'});
});

// Титул дня (ГОТОВО)
bot.onText(/^!(.+) дня$/gi, function (msg, match) {
    if (match[1] !== 'пара') {
        let chatId = msg.chat.id;
        let text = match[1];
        let usersChat = sqlite.run("SELECT * FROM users WHERE `chat_id` = ?", [chatId]);
        let random = randomTo(usersChat.length);
        let rndUserId = usersChat[random].user_id;
        let rndUserName = usersChat[random].user_name;
        let noteTime = sqlite.run("SELECT `title_time` FROM times WHERE `chat_id` = ? ", [chatId]);
        let time = Date.now();
        let date = new Date().getDate() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getFullYear();

        if (noteTime.length) {
            let prevTime = noteTime[0].title_time;

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
    }
});

// Список титулов дня (ГОТОВО)
bot.onText(/\/titles|^!титулы/gi, function (msg) {
    let chatId = msg.chat.id;
    let date = new Date().getDate() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getFullYear();
    let titlesData = sqlite.run("SELECT * FROM titles WHERE `chat_id` = ?", [chatId]);
    let titlesList = [];
    console.log('Список титулов');

    titlesData.forEach(function (item) {
        if (item.date == date) {
            titlesList.push('👤' + item.user_name + ' - ' + item.title + ' дня👑');
        }
    });

    bot.sendMessage(chatId, '🤖<b>Титулы дня</b>🤖\n\n' + titlesList.join('\n'), {parse_mode: 'html'});
});

// Пара дня (В РАЗРАБОТКЕ)
/*bot.onText(/^!пара$/gi, function (msg) {
    var chatId = msg.chat.id;
    var noteTime = sqlite.run("SELECT `couple_time` FROM times WHERE chat_id = ? ", [chatId]);
    var users = sqlite.run("SELECT * FROM users WHERE `chat_id` = ?", [chatId]);
    var user1 = users[randomTo(users.length)];
    var user2 = users[randomTo(users.length)];
    var time = Date.now();

    // bot.getChatMember(chatId,);

    if (noteTime.length) {
        var prevTime = noteTime[0].couple_time;

        if ((prevTime + 3600000) <= time) {
            sqlite.run("UPDATE times SET `couple_time` = ? WHERE `chat_id` = ?", [time, chatId]);
            bot.sendMessage(chatId, '🤖<b>Пара дня</b>🤖\n\n🌚<a href="tg://user?id=' + user1.user_id + '">' + user1.user_name + '</a>🌝\n👆🏻  👇🏻\n🌚<a href="tg://user?id=' + user2.user_id + '">' + user2.user_name + '</a>🌝', {parse_mode: 'html'});
        }
        else {
            bot.sendMessage(chatId, '🤖Выбрать пару дня можно раз в час🤖');
        }
    }
    else {
        sqlite.insert("times", {chat_id: chatId, couple_time: time});
        bot.sendMessage(chatId, '🤖Пара дня🤖\n\n🌚<a href="tg://user?id=' + user1.user_id + '">' + user1.user_name + '</a>🌝\n❤👆🏻❤👇🏻❤\n🌚<a href="tg://user?id=' + user2.user_id + '">' + user2.user_name + '</a>🌝', {parse_mode: 'html'});
    }
});*/

// Отдать монетки (ГОТОВО)
bot.onText(/^\+(\d+)$/, function (msg, match) {
    if ("reply_to_message" in msg) {
        let userId = msg.from.id;
        let userName = msg.from.first_name;
        let chatId = msg.chat.id;
        let coinsVal = Number(match[1]);
        let userCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [userId])[0].coins_value);
        let result;
        let replyId = msg.reply_to_message.from.id;
        let replyName = msg.reply_to_message.from.first_name;
        let replyCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [replyId])[0].coins_value);

        if (userId === replyId) return;

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
bot.onText(/^\+$|^спасибо$/gi, function (msg) {
    if ("reply_to_message" in msg) {
        var userId = msg.from.id;
        var userName = msg.from.first_name;
        var chatId = msg.chat.id;
        var userCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [userId])[0].coins_value);
        var replyId = msg.reply_to_message.from.id;
        var replyName = msg.reply_to_message.from.first_name;
        var replyCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [replyId])[0].coins_value);
        var result;

        if (userId === replyId) {
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
        bot.sendMessage(chatId, userName + ' поделился монеткой 💰1💰\n' + replyName + ' у тебя 💰' + result + '💰');
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
        var chance = randomTo(100);
        var stolenCoins = randomTo(coinsVal);
        var resultMinus;
        var resultPlus;
        var text = '';

        if (userId === replyId) return;
        if (replyId === +config.creator_id) {
            bot.sendMessage(chatId, userName + ' не смог отнять 💰монеты💰 у ' + replyName);
            return;
        }

        if (coinsVal > Math.floor(replyCoins / 2)) {
            bot.sendMessage(chatId, userName + ', нельзя отнимать больше 50%');
            return;
        }
        else if (chance > Math.floor(100 / 2.5)) {
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

// Предупреждение (В ПРОЦЕССЕ)
bot.onText(/^!warn$|^!w$/gi, function (msg) {
    if ("reply_to_message" in msg) {
        var userId = msg.from.id;
        var replyId = msg.reply_to_message.from.id;
        var replyName = msg.reply_to_message.from.first_name;
        var warns = sqlite.run("SELECT `warns` FROM users WHERE `user_id` = ?", [replyId])[0].warns;
        var textMsg = replyName + ', получил(а) мут на 30 минут 🙊';

        if (userId === replyId) return;

        if (warns >= 3) {
            bot.getChatMember(chatId, userId).then(function (data) {
                let status = data.status;

                if (status === 'creator' || status === 'administrator') {
                    warns = +1;
                    textMsg = 'Админ ' + replyName + ', получил(а) предупреждение 🙊';
                }
                else {
                    warns = +1;
                    textMsg = replyName + ', получил(а) мут на 30 минут 🙊';
                    sqlite.run("UPDATE users SET `warns` = ? WHERE `user_id` = ?", [warns, replyId]);
                    // bot.restrictChatMember(chatId, replyId, {can_send_message: false, until_date: (30 * 60)});
                }

                console.log(warns);

                bot.sendMessage(chatId, textMsg);
            });
        }
    }
});

// Мут за монетки (В ПРОЦЕССЕ)
bot.onText(/^!мут$/gi, function (msg) {
    /*if ("reply_to_message" in msg) {
        var userId = msg.from.id;
        var userName = msg.from.first_name;
        var chatId = msg.chat.id;
        var userCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [userId])[0].coins_value);
        var replyId = msg.reply_to_message.from.id;
        var replyName = msg.reply_to_message.from.first_name;
        var time = msg.date + 60;
        var result = userCoins - 500;
        var textMsg = '';

        // if (userId == replyId) return

        /!*if () {

        }
        else {
        }*!/

        bot.getChatMember(chatId, replyId).then(function (data) {
            let status = data.status;

            if (replyId === 858822892) {
                textMsg = userName + ', не смог заткнуть ' + replyName + '😋';
            }

            if (status === 'administrator' || status === 'creator') {
                textMsg = '🤖Нельзя дать мут Администратору🤖';
                // console.log('Пользователь не может дать мут АДМИНУ');
            }
            else if (status === 'restricted') {
                textMsg = replyName + ' уже молчит🙊';
                // console.log('Пользователь уже молчит');
            }
            else if (userId === +config.creator_id) {
                textMsg = replyName + ', получил(а) мут🙊';
                bot.restrictChatMember(chatId, replyId, {can_send_message: false, until_date: time});
                // console.log('Создатель заткнул наглеца');
            }
            else if (userCoins >= 500 && randomTo(100) > randomTo(100)) {
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
    }*/

    bot.sendMessage(chatId, '🤖 Функция временно недоступна. 🤖\n🤖 Ведутся технические работы 🤖', {parse_mode: 'html'});
});

// Мут для администраторов (ГОТОВО)
bot.onText(/^!!мут (\d+)$/gi, function (msg, match) {
    if ("reply_to_message" in msg) {
        let userId = msg.from.id;
        let chatId = msg.chat.id;
        let replyId = msg.reply_to_message.from.id;
        let replyName = msg.reply_to_message.from.first_name;
        let value = Number(match[1]);
        let time = Number(msg.date) + (value * 60);
        let textMsg = '';
        let minutes = value === 1 ? ' минуту' : value > 4 ? ' минут' : ' минуты';

        if (userId === replyId || value === 0) return false;

        bot.getChatMember(chatId, replyId).then(function (data) {
            let status = data.status;

            if (status !== 'creator' && status !== 'administrator') {
                console.log(status + ' получил !!мут на ' + value + minutes);
                textMsg = replyName + ', получил(а) мут на ' + value + minutes + '🙊\n⬇ Сходи в ЛЕС ⬇';
                bot.restrictChatMember(chatId, replyId, {can_send_message: false, until_date: time});
            }
            else {
                textMsg = '🤖 Нельзя заткнуть Администратора 🤖';
            }

            bot.sendMessage(chatId, textMsg, options.forestBtn);
        });
    }
});

// Дверь в ЛЕС
bot.onText(/^ЛЕС$/gi, function (msg) {
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Дверь в ЛЕС открыта', options.forestBtn);
});

// Таймер
bot.onText(/\/timer (.+)/gi, function (msg, match) {
    let num = match[1];
    timerUser(num, msg);
});

/* ******************************************** */

bot.onText(/(.+)/, function (msg, match) {
    var userId = msg.from.id;

    if (msg.chat.type === 'private' && userId === +config.creator_id) {
        var toChat = '-1001371079286';
        var text = match[1];

        bot.sendMessage(toChat, text);
    }
});

// Случайное число
bot.onText(/^!р$/gi, function (msg) {
    let chatId = msg.chat.id;
    let num;
    let iteration = 1;

    let random = setInterval(function () {
        num = randomTo(10);
        bot.sendMessage(chatId, iteration++ + ':' + num);
    }, 1000);
    setTimeout(function () {
        clearInterval(random);
    }, 5100);
});

bot.onText(/\/test/gi, function (msg) {
    let userId = msg.from.id;
    let userName = msg.from.first_name;
    let chatId = msg.chat.id;
    let chatTitle = msg.chat.title;

    let usersChat = sqlite.run("SELECT * FROM users WHERE `chat_id` = ?", [chatId]);
    console.log(usersChat.length);

    bot.sendMessage(chatId, 'Функции бота🎲', options.testBtn);

    bot.getChatMember(chatId, 692075142).then(function (data) {
        console.log(data);
    });

    isMember(msg.chat.id);

});

bot.on('callback_query', function (msg) {
    var chatId = msg.message.chat.id;
    var data = msg.data;

    if (data === 'пара') {
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

function addUser(uId, uName, cId) {
    console.log('New user - ' + uName + ' - ' + arguments["3"]);
    sqlite.insert("users", {user_id: uId, user_name: uName, user_nick: arguments["3"], chat_id: cId, coins_value: 1000, warns: 0}, function (res) {
        if (res.error) {
            throw res.error;
        }
    });
}

function newMember(data) {
    let userId = data.new_chat_participant.id;
    let userName = data.new_chat_participant.first_name;
    let chatId = data.chat.id;
    let chatName = data.chat.title;
    let userNick;

    if (!isUserExists(userId)) {
        if ("username" in data.new_chat_member) {
            userNick = data.new_chat_member.username;
        }
        addUser(userId, userName, chatId, userNick);
    }

    bot.getChatAdministrators(chatId).then((admin_data) => {
        let creatorId = Number(config.creator_id);

        admin_data.forEach((i) => {
            if (i.status === 'administrator' && !i.user.is_bot) {
                bot.sendMessage(i.user.id, '👍🏻 В чат ' + chatName + ' вошёл новый пользователь <a href="tg://user?id=' + userId + '">' + userName + '</a> 👍🏻', {parse_mode: 'html'});
            }
            else if (i.status === 'creator') {
                creatorId = i.user.id;
            }
        });

        bot.sendMessage(creatorId, '👍🏻 В чат ' + chatName + ' вошёл новый пользователь <a href="tg://user?id=' + userId + '">' + userName + '</a> 👍🏻', {parse_mode: 'html'});
    });
    bot.sendMessage(chatId, '🙂 Добро пожаловать <a href="tg://user?id=' + userId + '">' + userName + '</a> 🙂', {parse_mode: 'html'});
}

function callAdmins(chatId) {
    bot.getChatAdministrators(chatId).then(function (data) {
        let admins = [];

        data.forEach(function (elem) {
            if (!elem.user.is_bot) {
                admins.push('<a href="tg://user?id=' + elem.user.id + '">' + elem.user.first_name + '</a>');
            }
        });

        bot.sendMessage(chatId, admins.join(', \n'), {parse_mode: 'html'});
    });
}

function timerUser(m, msg) {
    let timeCounter = Number(m + '000') * 60;
    bot.sendMessage(msg.chat.id, 'таймер на ' + m + ' минут установлен');
    let time = setInterval(() => {
        bot.sendMessage(msg.chat.id, '<a href="tg://user?id=' + msg.from.id + '">' + msg.from.first_name + '</a> таймер на ' + m + 'минут завершился', {parse_mode: 'html'});
        clearTimeout(time);
    }, timeCounter);
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
    return Math.floor((Math.random() * n) + 1);
}

function userUpdate(uId) {
    var user = sqlite.run("SELECT * FROM users WHERE `user_id` = ?", [uId]);

    console.log(user);
}

function isMember(chat_id) {
    let usersChat = sqlite.run("SELECT * FROM users WHERE `chat_id` = ?", [chat_id]);
    let random = randomTo(usersChat.length);

    let randomUser = {
        id: usersChat[random].user_id,
        name: usersChat[random].user_name,
    }

    console.log(randomUser);

    return randomUser;
}