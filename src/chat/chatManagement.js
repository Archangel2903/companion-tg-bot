const {query} = require('../database/db');

function mute(bot) {
    bot.onText(/^\/mute (\d+)$/, (msg, match) => {
        if ("reply_to_message" in msg && msg.chat.type === "supergroup") {
            const {from: {id: user_id}, chat: {id: chat_id}, date, reply_to_message: {from: {id: reply_id}}} = msg;
            const mute_value = Number(match[1]);
            const time = Number(date) + (mute_value * 60);

            if (user_id !== reply_id || mute_value !== 0) {
                bot.getChatMember(chat_id, reply_id)
                    .then((user) => {
                        const {user: {first_name}, status} = user;
                        let message_text = `🤖 Нельзя заткнуть Администратора 🤖`;

                        if (status !== ("creator" || "administrator")) {
                            message_text = `${first_name} не может писать минут: ${mute_value}`;
                            bot.restrictChatMember(chat_id, reply_id, {can_send_message: false, until_date: time});
                        }

                        bot.sendMessage(chat_id, message_text, {parse_mode: 'html'})
                    })
                    .catch(err => {
                        console.error(err);
                    })
            } else {
                bot.sendMessage(chat_id, message_text, {parse_mode: 'html'})
            }
        } else {
            bot.sendMessage(msg.chat.id, 'Отправьте команду в ответ на сообщение');
        }
    });
}

function warn(bot) {
    bot.onText(/^\/warn/, (msg) => {
        if (msg.reply_to_message) {
            const { from: { id: user_id }, chat: { id: chat_id }, reply_to_message: { from: { id: reply_id, first_name: reply_first_name } }, date } = msg;

            if (reply_id !== user_id) {
                const warns = query("SELECT `warn_count` FROM warns WHERE `user_id` = ?", [reply_id]);

                if (warns.length > 0) {
                    const warnCount = warns[0].warn_count + 1;
                    query("UPDATE warns SET `warn_count` = ? WHERE `user_id` = ?", [warnCount, reply_id]);
                    bot.sendMessage(chat_id, `${reply_first_name} получил(а) предупреждение.\n ${warnCount}/3`);

                    if (warnCount >= 5) {
                        const muteTime = Math.floor(Date.now() / 1000) + warnCount * 60;
                        bot.restrictChatMember(chat_id, reply_id, { can_send_messages: false, until_date: muteTime });
                        bot.sendMessage(chat_id, `${reply_first_name} получил(а) мут на ${warnCount} минут.`);
                    }
                } else {
                    const muteTime = Math.floor(Date.now() / 1000) + 60; // Мут на 1 минуту
                    query("INSERT INTO warns (user_id, warn_count) VALUES (?, ?)", [reply_id, 1]);
                    bot.restrictChatMember(chat_id, reply_id, { can_send_messages: false, until_date: muteTime });
                    bot.sendMessage(chat_id, `${reply_first_name} получил(а) мут на 1 минуту.`);
                }
            } else {
                bot.sendMessage(chat_id, 'Нельзя дать предупреждение самому себе.');
            }
        }
    });
}

module.exports = {mute, warn}