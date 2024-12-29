const {isUserExists, addUser} = require('../users/userManagement');
const {log} = require('../utils/helpers');

function startCommand(bot) {
    bot.onText(/^\/start$/gi, (msg) => {
        const {from: {id: user_id, first_name, username = null}, chat: {id: chat_id}} = msg;
        const msgText = `
Привет <a href="tg://user?id=${user_id}">${first_name}</a>\n
<b>Команды бота:</b>
/start - Приветственное сообщение.
/weather [city] - Узнать погоду в вашем городе.
<b><i>Игровые</i></b>
/balance - Узнать баланс своего счета.
/ruleAlias - Правила игры в Alias.
/startAlias - Начать игру в Alias.
/endAlias - Завершить игру в Alias.
/ruleRoulette - Правила игры в рулетку.
/roulette - Запустить рулетку.`

        bot.sendMessage(chat_id, msgText, {parse_mode: 'html'});
        if (!isUserExists(user_id)) {
            addUser(user_id, first_name, username);
        }
    });
}

module.exports = {startCommand};


/*
const msgText = `
Привет <a href="tg://user?id=${user_id}">${first_name}</a>\n
<b>Команды бота:</b>
/start - Приветственное сообщение.
/weather [city] - Узнать погоду в вашем городе.
<b><i>Команды для чатов</i></b>
/admins - Позвать администраторов чата сообщением.
/mute - Запретить пользователю писать на [minutes] в чате.
/warn - Дать предупреждение пользователю и запретить писать в чат.
<b><i>Игровые</i></b>
/balance - Узнать баланс своего счета.
/ruleAlias - Правила игры в Alias.
/startAlias - Начать игру в Alias.
/endAlias - Завершить игру в Alias.
/ruleRoulette - Правила игры в рулетку.
/roulette - Запустить рулетку.`
*/