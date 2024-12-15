const config = require('../../configuration.json');

function test(bot) {
    bot.onText(/^\/test$/, (msg) => {
        if (config.creator_id === msg.from.id) {
            const {chat: {id}} = msg;
            bot.sendMessage(id, `<pre>${JSON.stringify(msg, null, 2)}</pre>`, {parse_mode: 'html'});
        }
    });
}

module.exports = { test }