function callAdmins(bot) {
    bot.onText(/^\/admins/, ({chat: {id: chat_id, type}}) => {
        if (type !== 'private') {
            bot.getChatAdministrators(chat_id)
                .then(function (admins) {
                    let realAdmins = admins.reduce((acc, admin) => {
                        if (!admin.user.is_bot) {
                            acc.unshift(`<a href="tg://user?id=${admin.user.id}">${admin.user.first_name}</a>`);
                        }
                        return acc;
                    }, []);

                    bot.sendMessage(chat_id, realAdmins.join('\n'), {parse_mode: 'html'});
                });
        }
    });
}

module.exports = { callAdmins }