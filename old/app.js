'use strict'
// buffoon_bot
const TelegramBot = require('node-telegram-bot-api');
const config = require('../configuration.json');
const token = config.token;
const bot = new TelegramBot(token, {polling: true});
const sqlite = require('sqlite-sync');

sqlite.connect('library.db');
sqlite.run("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL UNIQUE, user_name TEXT NOT NULL, user_nick TEXT UNIQUE, coins_value INTEGER NOT NULL, warns INTEGER NOT NULL)",
    function (res) {
        if (res.error) throw res.error;
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

const CREATOR_ID = +config.creator_id;
const BOT_CHAT_ID = +'-1001412767338';
const COMMANDS = {
    START: '\/start',
    CHAT_ADMIN: '\/admins',
    WARN: '\/warn',
    UNWARN: '\/unwarn',
    MUTE: '\/mute',
    BALANCE: '\/balance',
    TIMER: '\/timer',
    TEST: '\/test'
};
const BUTTONS = {
    forest: {
        reply_markup: {
            inline_keyboard: [
                [{text: '🌳🌲➡ ЛЕС ⬅🌲🌳', url: 'https://t.me/forest_chat'}]
            ]
        }
    },
    games: {
        hl: {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Меньше', callback_data: 'low'},
                        {text: 'Больше', callback_data: 'high'}
                    ],
                    [{text: 'Закончить', callback_data: 'stop'}]
                ]
            }
        }
    },
    test: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                // [{text: 'Титул дня', callback_data: 'титул'}],
                // [{text: 'Пара дня', callback_data: 'пара'}],
                [{text: 'Test', callback_data: 'test'}],
                [{text: 'Random User', callback_data: 'random'}],
                [{text: 'Close', callback_data: 'close'}],
                // [{text: 'Позвать администраторов', callback_data: 'админы'}],
                // [{text: '🌳🌲➡ ЛЕС ⬅🌲🌳', url: 'https://t.me/forest_chat', callback_data: 'forest'}]
            ]
        })
    },
    keyboard_test: {
        reply_markup: {
            keyboard: [
                [`/start`],
            ]
        }
    }
};

/*const USER = {
    data,
}*/

// Buttons callback listener
bot.on('callback_query', (msg) => {
    let userId = msg.from.id;
    if (userId === +config.creator_id) {
        let {message: {chat, message_id, text}, data} = msg;
        switch (data) {
            case 'random':
                console.log(`switch ${data}`);
                console.log(randomChatMember(chat.id));
                break

            case 'admins':
                console.log(`switch ${data}`);
                callAdmins(chat.id);
                break

            case 'update':
                console.log(`switch ${data}`);
                break

            case 'lottery':
                console.log(`switch ${data}`);
                break

            case 'close':
                console.log(`switch ${data}`);
                bot.deleteMessage(chat.id, message_id);
                break

            case 'test':
                console.log(`switch ${data}`);


                break

            default:
                console.log(`switch ${data}`);
                break
        }

        bot.answerCallbackQuery({
            callback_query_id: msg.id,
            text: data
        });
    } else return false;
});

// Test
bot.onText(new RegExp(`${COMMANDS.TEST}`, 'gi'), ({ message_id, from: {id: uId}, chat: {id: cId} }) => {
    bot.deleteMessage(cId, message_id);
    if (uId === CREATOR_ID) {
        bot.sendMessage(BOT_CHAT_ID, `TeSt`, {parse_mode: 'html'});
    }
});

// <a href="tg://user?id=123456789">Name</a>

// Bot commands
// Listener messages
bot.on('message', ({ from: {id: userId, first_name, username = undefined}, chat: {id: chatId, type}, text }, ...rest) => {
    if (!isUserExists(userId)) {
        if (typeof username === string && username !== undefined) {
            addUser(userId, first_name, chatId, first_name);
            console.log(username);
        } else {
            addUser(userId, first_name, chatId, null);
            console.log(username);
        }
    }

    if (type === 'private' && userId === +config.creator_id) {
        let toChat = '-1001371079286';
        bot.sendMessage(toChat, text);
    }

    /*let daun = 1128150776;
    let hui = ['ЛОХ', 'иди на хуй', 'присел на бутылку', 'ФУ!!!', 'АтсАси', 'олигафрен', 'чмошник', 'https://natribu.org/', 'очкошник', 'калл', 'даёт за пивас'];
    if (userId === 1128150776 || userId === 1210351347) {
        let nh = randomTo(hui.length - 1);

        bot.sendMessage(chatId, '<a href="tg://user?id=' + userId + '">Алёша</a>, ' + hui[nh], {parse_mode: 'html'});
    }*/
});
bot.on('new_chat_members', (msg) => newMember(msg));
bot.on('left_chat_member', (msg) => departedUser(msg));

// /start
bot.onText(new RegExp(`^${COMMANDS.START}$`, 'gi'), (msg) => {
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

    bot.sendMessage(msg.chat.id, 'Клавиатура отключена', {
        reply_markup: {
            remove_keyboard: true
        }
    });
});

// /admins
bot.onText(new RegExp(`^(${COMMANDS.CHAT_ADMIN}|админы)$`, 'gi'), ({chat: {id, type}}) => {
    type !== 'private' ? callAdmins(id) : false
});

// /balance
bot.onText(new RegExp(`^(${COMMANDS.BALANCE}|баланс)$`, 'gi'), (msg) => {
    let userId = msg.from.id;
    let userName = msg.from.first_name;
    let chatId = msg.chat.id;
    let data_coins = sqlite.run("SELECT coins_value FROM users WHERE user_id = ?", [userId])[0].coins_value;
    let textMsg = userName + ', на твоём счету:\n💰' + data_coins + '💰';

    bot.sendMessage(chatId, textMsg);
});

// /warn
bot.onText(new RegExp(`^${COMMANDS.WARN}$`, 'gi'), (msg) => {
    let {from: {id, first_name}, chat, date} = msg;
    // bot.deleteMessage(chat.id, message_id);

    if ("reply_to_message" in msg) {
        let {reply_to_message} = msg;
        let warn_count = sqlite.run("SELECT warns FROM users WHERE `user_id` = ?", [reply_to_message.from.id])[0].warns;
        let linkChatId = String(chat.id).replace(/-100/, '');
        let time = Number(date) + 10 * 60;

        if (msg.reply_to_message.from.id === id) {
            bot.sendMessage(chat.id, 'Нельзя дать предупреждение самому себе');
            return false;
        } else {
            warn_count += 1;
            sqlite.run("UPDATE users SET `warns` = ? WHERE `user_id` = ?", [warn_count, reply_to_message.from.id]);
            bot.sendMessage(chat.id, `${reply_to_message.from.first_name} получил(а) предупреждение.\n ${warn_count}\\3`);

            if (warn_count >= 3) {
                bot.restrictChatMember(chat.id, reply_to_message.from.id, {can_send_message: false, until_date: time});
                bot.sendMessage(chat.id, `${reply_to_message.from.first_name}, получил(а) мут на 10 минут`);
                bot.getChatAdministrators(chat.id).then((query) => {
                    query.forEach((data) => {
                        if (!data.user.is_bot) {
                            bot.forwardMessage(data.user.id, reply_to_message.chat.id, reply_to_message.message_id);
                            bot.sendMessage(data.user.id, `ПРЕДУПРЕЖДЕНИЕ от ${first_name}`, {
                                reply_markup: {
                                    inline_keyboard: [
                                        [{
                                            text: 'Перейти к сообщению',
                                            url: `https://t.me/c/${linkChatId}/${reply_to_message.message_id}`
                                        }]
                                    ]
                                }
                            });
                        }
                    });
                }).catch((err) => {
                    console.log(err);
                });
            } else {
                bot.getChatAdministrators(chat.id).then((query) => {
                    query.forEach((data) => {
                        if (!data.user.is_bot) {
                            bot.forwardMessage(data.user.id, reply_to_message.chat.id, reply_to_message.message_id);
                            bot.sendMessage(data.user.id, `ПРЕДУПРЕЖДЕНИЕ от ${first_name}`, {
                                reply_markup: {
                                    inline_keyboard: [
                                        [{
                                            text: 'Перейти к сообщению',
                                            url: `https://t.me/c/${linkChatId}/${reply_to_message.message_id}`
                                        }]
                                    ]
                                }
                            });
                        }
                    });
                }).catch((err) => {
                    console.log(err);
                });
            }
        }
    } else {
        bot.sendMessage(chat.id, 'Отправьте команду в ответ на сообщение');
    }
});

// /unwarn
bot.onText(new RegExp(`^${COMMANDS.UNWARN}$`, 'gi'), (msg) => {
    let {chat, reply_to_message: {from}} = msg;

    if ("reply_to_message" in msg) {
        if (msg.from.id === from.id) {
            return false;
        } else {
            bot.getChatMember(chat.id, msg.from.id).then((query) => {
                switch (query.status) {
                    case 'creator':
                        sqlite.run("UPDATE users SET warns = 0 WHERE user_id = ?", [from.id]);
                        bot.sendMessage(chat.id, `${from.first_name}, предупреждения обнуленны`);
                        break

                    case 'administrator':
                        sqlite.run("UPDATE users SET warns = 0 WHERE user_id = ?", [from.id]);
                        bot.sendMessage(chat.id, `${from.first_name}, предупреждения обнуленны`);
                        break

                    default:
                        bot.sendMessage(chat.id, `Ты кто такой? Давай до свидания!`);
                }
            });
        }
    } else {
        bot.sendMessage(chat.id, 'Отправьте команду в ответ на сообщение');
    }
});

// /mute
bot.onText(new RegExp(`^${COMMANDS.MUTE} (\\d+)$`, 'gi'), function (msg, match) {
    if ("reply_to_message" in msg) {
        let userId = msg.from.id;
        let chatId = msg.chat.id;
        let replyId = msg.reply_to_message.from.id;
        let replyName = msg.reply_to_message.from.first_name;
        let value = Number(match[1]);
        let time = Number(msg.date) + (value * 60);
        let textMsg = '';
        let minutes = value === 1 ? ' минуту' : value > 4 ? ' минут' : ' минуты';

        bot.deleteMessage(chatId, msg.message_id);

        if (userId === replyId || value === 0) return false;

        bot.getChatMember(chatId, replyId).then(function (data) {
            let status = data.status;

            if (status !== 'creator' && status !== 'administrator') {
                console.log(status + ' получил !!мут на ' + value + minutes);
                textMsg = replyName + ', получил(а) мут на ' + value + minutes + '🙊\n⬇ Сходи в ЛЕС ⬇';
                bot.restrictChatMember(chatId, replyId, {can_send_message: false, until_date: time});
            } else {
                textMsg = '🤖 Нельзя заткнуть Администратора 🤖';
            }

            bot.sendMessage(chatId, textMsg, BUTTONS.forest);
        });
    } else return false;
});

/*bot.onText(new RegExp(`^${COMMANDS.MUTE}|мут$`, 'gi'), function (msg, match) {
    console.log(msg);
    // console.log(arguments);


    /!*if ("reply_to_message" in msg) {
        let userId = msg.from.id;
        let userName = msg.from.first_name;
        let chatId = msg.chat.id;
        let userCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [userId])[0].coins_value);
        let replyId = msg.reply_to_message.from.id;
        let replyName = msg.reply_to_message.from.first_name;
        let time = msg.date + 60;
        let result = userCoins - 500;
        let textMsg = '';

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
            else if (userId === +const.creator_id) {
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
    }*!/

    bot.sendMessage(chatId, '🤖 Функция временно недоступна. 🤖\n🤖 Ведутся технические работы 🤖', {parse_mode: 'html'});
});*/

// Титул дня (ГОТОВО)
bot.onText(/^(!.+) дня$/gi, (msg, match) => {
    if (match[1] !== 'пара') {
        let chatId = msg.chat.id;
        let text = match[1];
        let member = randomChatMember(chatId) || false;
        let noteTime = sqlite.run("SELECT `title_time` FROM times WHERE `chat_id` = ? ", [chatId]);
        let time = Date.now();
        let date = new Date().getDate() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getFullYear();

        if (member) {
            let memberId = member.id;
            let memberName = member.name;

            if (noteTime.length) {
                // let prevTime = noteTime[0].title_time;
                //(prevTime + 3600000) <= time

                if (true) {
                    sqlite.insert("titles", {
                        chat_id: chatId,
                        user_id: memberId,
                        user_name: memberName,
                        title: text,
                        date: date
                    });
                    sqlite.run("UPDATE times SET `title_time` = ? WHERE `chat_id` = ?", [time, chatId]);
                    bot.sendMessage(chatId, text + ' дня у нас <a href="tg://user?id=' + memberId + '">' + memberName + '</a>', {parse_mode: 'html'});
                } else {
                    bot.sendMessage(chatId, '🤖Выбрать титул дня можно раз в час🤖');
                }
            } else {
                sqlite.insert("times", {chat_id: chatId, title_time: time});
                sqlite.insert("titles", {
                    chat_id: chatId,
                    user_id: memberId,
                    user_name: memberName,
                    title: text,
                    date: date
                });
                bot.sendMessage(chatId, text + ' дня у нас <a href="tg://user?id=' + memberId + '">' + memberName + '</a>', {parse_mode: 'html'});
            }
        } else return false;
    }
});

// Список титулов дня (ГОТОВО)
bot.onText(new RegExp(`/titles|^!титулы$`, 'gi'), (msg) => {
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
    let chatId = msg.chat.id;
    let noteTime = sqlite.run("SELECT `couple_time` FROM times WHERE chat_id = ? ", [chatId]);
    let users = sqlite.run("SELECT * FROM users WHERE `chat_id` = ?", [chatId]);
    let user1 = users[randomTo(users.length)];
    let user2 = users[randomTo(users.length)];
    let time = Date.now();

    // bot.getChatMember(chatId,);

    if (noteTime.length) {
        let prevTime = noteTime[0].couple_time;

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
bot.onText(/^\+(\d+)$/, (msg, match) => {
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
        } else {
            result = userCoins - coinsVal;
            sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [result, userId]);
        }

        result = replyCoins + coinsVal;
        sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [result, replyId]);

        bot.sendMessage(chatId, userName + ' отдал 💰' + coinsVal + '💰\n' + replyName + ' итого у тебя 💰' + result + '💰', {parse_mode: 'html'});
    } else {
        bot.sendMessage(chatId, 'Ошибочка!', {parse_mode: 'html'});
    }
});
bot.onText(/^(\+|спасибо|👍🏻)$/gi, (msg) => {
    if ("reply_to_message" in msg) {
        let userId = msg.from.id;
        let userName = msg.from.first_name;
        let chatId = msg.chat.id;
        let userCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [userId])[0].coins_value);
        let replyId = msg.reply_to_message.from.id;
        let replyName = msg.reply_to_message.from.first_name;
        let replyCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [replyId])[0].coins_value);
        let result;

        if (userId === replyId) {
            return;
        } else if (userCoins <= 0) {
            bot.sendMessage(chatId, userName + ', нельзя отдать больше чем имеешь☝🏻');
            return;
        } else {
            result = userCoins - 1;
            sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [result, userId]);
        }

        result = replyCoins + 1;
        sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [result, replyId]);
        bot.sendMessage(chatId, userName + ' поделился монеткой 💰1💰\n' + replyName + ' у тебя 💰' + result + '💰');
    }
});

// Отнять монетки (ГОТОВО)
bot.onText(/^-(\d+)$/, (msg, match) => {
    if ("reply_to_message" in msg) {
        let userId = msg.from.id;
        let userName = msg.from.first_name;
        let userCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [userId])[0].coins_value);
        let chatId = msg.chat.id;
        let coinsVal = Number(match[1]);
        let replyId = msg.reply_to_message.from.id;
        let replyName = msg.reply_to_message.from.first_name;
        let replyCoins = Number(sqlite.run("SELECT `coins_value` FROM users WHERE `user_id` = ?", [replyId])[0].coins_value);
        let chance = randomTo(100);
        let stolenCoins = randomTo(coinsVal);
        let resultMinus;
        let resultPlus;
        let text = '';

        if (userId === replyId) return;
        if (replyId === +config.creator_id) {
            bot.sendMessage(chatId, userName + ' не смог отнять 💰монеты💰 у ' + replyName);
            return;
        }

        if (coinsVal > Math.floor(replyCoins / 2)) {
            bot.sendMessage(chatId, userName + ', нельзя отнимать больше 50%');
            return;
        } else if (chance > Math.floor(100 / 2.5)) {
            resultMinus = replyCoins - stolenCoins;
            resultPlus = userCoins + stolenCoins;
            sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [resultMinus, replyId]);
            sqlite.run("UPDATE users SET `coins_value` = ? WHERE `user_id` = ?", [resultPlus, userId]);
            text = userName + ' отнял 💰' + stolenCoins + '💰\n' + replyName + ' у тебя осталось 💰' + resultMinus + '💰';
        } else {
            text = userName + ' не смог отнять 💰монеты💰 у ' + replyName;
        }
        bot.sendMessage(chatId, text);
    }
});

// Розыгрыш монеток (В ПРОЦЕССЕ)
bot.onText(/^!розыгрыш (\d+)$/gi, (msg, match) => {
    let userId = msg.from.id;
    let chatId = msg.chat.id;
    let prize = Number(match[1]);
    let buttons = {
        reply_markup: {
            inline_keyboard: [
                [{text: 'Учавствовать в розыгрыше', callback_data: 'raffle_start'}]
            ]

        }
    }
    console.log(userId, chatId, prize);
    // СДЕЛАТЬ ЗАПИСЬ НА УЧАСТИЕ В РОЗЫГРЫШЕ С КНОПКАМИ
    // ПЕРЕЗАПИСЫВАЮЩЕЕСЯ СООБЩЕНИЕ

    bot.sendMessage(chatId, 'Разыгрывается ' + prize + ' монет', buttons);
});

// Дверь в ЛЕС
bot.onText(/^лес$/gim, (msg) => {
    let chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Дверь в ЛЕС открыта', BUTTONS.forest);
});

// Таймер
bot.onText(new RegExp(`^${COMMANDS.TIMER} (\\d+)$`, 'gi'), (msg, match) => {
    let num = match[1];
    timerUser(num, msg);
});

// Game --- High&Low
bot.onText(/\/game (.+)/gi, function (msg, match) {
    let bet = Number(match[1]);
    let chatId = msg.chat.id;
    // let userId = msg.from.id;

    let startNumber = randomTo(10);

    console.log('Ставка ' + bet);
    console.log('Начальное число ' + startNumber);

    bot.sendMessage(chatId, 'Игра High&Low\nУгадай следующее число от 1 до 10\n' + startNumber, BUTTONS.games.hl);
});

/* ******************************************** */

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

// Functions

function randomTo(n) {
    return Math.floor((Math.random() * n) + 1);
}

function isUserExists(uId) {
    return sqlite.run("SELECT COUNT(*) as cnt FROM users WHERE `user_id` = ?", [uId])[0].cnt != 0;
}

function addUser(uId, uName, cId) {
    console.log('New user - ' + uName + ' - ' + arguments["3"]);
    sqlite.insert("users", {
        user_id: uId,
        user_name: uName,
        user_nick: arguments["3"],
        chat_id: cId,
        coins_value: 1000,
        warns: 0
    }, function (res) {
        if (res.error) {
            throw res.error;
        }
    });
}

function newMember({ chat: {id: chatId, title}, new_chat_participant: {id: userId, first_name, username = null} }) {
    if (!isUserExists(userId)) {
        addUser(userId, first_name, chatId, username);
    }

    bot.getChatAdministrators(chatId)
        .then((query) => {
            let creatorId = Number(config.creator_id);

            query.forEach((i) => {
                let {status, user: {is_bot}} = i;
                if (!is_bot) {
                    switch (status) {
                        case 'administrator':
                            bot.sendMessage(i.user.id, `👍🏻 В чат ${title} вошёл новый пользователь <a href="tg://user?id=${userId}">${first_name}</a> 👍🏻`, {parse_mode: 'html'});
                            break;
                        default:
                            creatorId = i.user.id;
                            break
                    }
                }
            });

            bot.sendMessage(creatorId, `👍🏻 В чат ${title} вошёл новый пользователь <a href="tg://user?id=${userId}">${first_name}</a> 👍🏻`, {parse_mode: 'html'});
        })
        .catch((err) => {
            throw err.message;
        });

    bot.sendMessage(chatId, `🙂 Добро пожаловать <a href="tg://user?id=${userId}">${first_name}</a> 🙂`, {parse_mode: 'html'});
}

function departedUser({ chat: {id: chatId, title}, left_chat_participant: {id: userId, first_name} }) {
    bot.getChatAdministrators(chatId)
        .then(function (data) {
            let creatorId = CREATOR_ID;

            data.forEach(function (i) {
                let {status, user: {id}} = i;

                if (status === 'creator') {
                    creatorId = id;
                } else if (status === 'administrator') {
                    bot.sendMessage(id, `👎🏻 Из чата ${title} вышел пользователь <a href="tg://user?id=${userId}">${userName}</a> 👎🏻`, {parse_mode: 'html'});
                }
            });

            bot.sendMessage(creatorId, `👎🏻 Из чата ${title} вышел пользователь <a href="tg://user?id=${userId}">${userName}</a> 👎🏻`, {parse_mode: 'html'});
        })
        .catch((err) => {
            throw err.message;
        });

    bot.sendMessage(chatId, `🙁 Прощай <a href="tg://user?id=${userId}">${first_name}</a> 🙁`, {parse_mode: 'html'});
}

function callAdmins(chatId) {
    bot.getChatAdministrators(chatId).then(function (data) {
        let admins = [];

        data.forEach(function (elem) {
            if (!elem.user.is_bot) {
                admins.unshift('<a href="tg://user?id=' + elem.user.id + '">' + elem.user.first_name + '</a>');
            }
        });

        bot.sendMessage(chatId, admins.join(',\n'), {parse_mode: 'html'});
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

var loop = 0;

function randomChatMember(chat_id) {
    const usersChat = sqlite.run("SELECT * FROM users WHERE `chat_id` = ?", [chat_id]);
    console.log(usersChat);
    var random = randomTo(usersChat.length);
    var randomUser = {
        id: usersChat[random].user_id,
        name: usersChat[random].user_name,
    }

    // console.log(`loop = ${loop}`);
    //
    // console.log('random user start');
    // console.log(randomUser);

    bot.getChatMember(chat_id, randomUser.id)
        .then((data) => {
            // console.log('chat member data');
            // console.log(data);
            //
            // console.log('random user success');
            // console.log(randomUser);

            // bot.sendMessage(-1001412767338, `<code>${JSON.stringify(data)}</code>`, {parse_mode: 'html'});
            bot.sendMessage(-1001412767338, `<a href="tg://user?id=${data.user.id}">${data.user.first_name}</a>`, {parse_mode: 'html'});
            USER.data = data;
        })
        .catch((data) => {
            if (loop >= 10) {
                // console.log('chat member error data');
                // console.log('data.response.readable = ' + data.response.readable);
                return false;
            }

            console.log('random user error');
            console.log(usersChat[random]);
            sqlite.run('DELETE FROM users WHERE user_id = ?', [randomUser.id], (err) => {
                if (err) {
                    return console.error(err.message);
                }
            });
            randomChatMember(chat_id);
            loop++;
        });

    // console.log('random user final');
    // console.log(randomUser);

    // sqlite.run('DELETE FROM users WHERE user_id = ?', [randomUser.id]);

    /*bot.getChatMember(chat_id, randomUser.id)
        .then((data) => {
            switch (data.status) {
                case 'member':
                    console.log('member');
                    console.log(data);
                    randomUser = {
                        id: data.user.id,
                        name: data.user.first_name,
                    }
                    break

                case 'creator':
                    console.log('main admin');
                    console.log(data);
                    randomUser = {
                        id: data.user.id,
                        name: data.user.first_name,
                    }
                    break

                case 'administrator':
                    console.log('admins');
                    console.log(data);
                    randomUser = {
                        id: data.user.id,
                        name: data.user.first_name,
                    }
                    break

                case false:
                    console.log('false');
                    console.log(data);
                    break

                default:
                    console.log('default');
                    console.log(data);
                    randomUser = false;
                    break
            }
        })
        .catch((data) => {
            console.log('error random member');
            console.log(data);
            randomUser = false;
        });

    if (randomUser === false) {
        function loop(x) {
            if (x >= 10) {
                console.log('loop exit');
                return randomUser;
            }
            else {
                loop(x + 1);
                randomChatMember(chat_id);
            }
        }
        loop(0);
    }*/
}

function userUpdate(uId) {
    let user = sqlite.run("SELECT * FROM users WHERE `user_id` = ?", [uId]);

    console.log(user);
}

function isMember(chat_id, user_id) {

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


