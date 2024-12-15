function log(title) {
    return (msg) => console.log(`[${title}]: ${msg}`);
}

module.exports = { log }