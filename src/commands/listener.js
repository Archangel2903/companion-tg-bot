module.exports = (bot) => {
    bot.on('message', async (msg) => {
        if (!msg.entities) {
            if (msg.chat.type === 'private' && msg.from.id === 1245060963) {
                bot.sendMessage('-1001902435375', msg.text);
            }
        }
    });
}