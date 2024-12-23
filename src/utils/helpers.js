function log(title) {
    return (msg) => console.log(`[${title}]: ${msg}`);
}

function init(bot, fns) {
    fns.forEach((fn) => {
        fn(bot);
    });
}

module.exports = { init, log }