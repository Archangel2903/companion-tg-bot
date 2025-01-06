const emoji = {
    coin: '🪙',
    like: '👍',
    dislike: '👎',
    info: 'ℹ️',
    arrow_up: '🔼',
    arrow_down: '🔽',
    money: '💰',
    scroll: '📜',
    circle_red: '🔴',
    circle_green: '🟢',
    circle_black: '⚫️',
}

function log(title) {
    return (msg) => console.log(`[${title}]: ${msg}`);
}

function init(bot, fns) {
    fns.forEach((fn) => {
        fn(bot);
    });
}

module.exports = { init, log, emoji }