function hilo(bot) {
    bot.onText(/^\/hilo/gi, (msg) => {
        const {chat: {id: chat_id}} = msg;


    });
}

function getRandomNumber() {
    return Math.ceil(Math.random() * 100);
}

module.exports = {hilo}