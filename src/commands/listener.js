module.exports = (bot) => {
    bot.on('message', async (msg) => {
        if (!msg.entities) {
            console.log('Прослушка');
        }
    });
}