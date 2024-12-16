require('dotenv').config();
const creatorId = process.env.CREATOR_ID;

function test(bot) {
    bot.onText(/^\/test$/, (msg) => {
        if (creatorId === msg.from.id) {
            const {chat: {id}} = msg;
            bot.sendMessage(id, `<pre>${JSON.stringify(msg, null, 2)}</pre>`, {parse_mode: 'html'});
        }
    });
}

module.exports = { test }