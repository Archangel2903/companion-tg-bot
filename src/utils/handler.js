const sqlite = require('sqlite-sync');

function hasUser(uid) {
    const result = sqlite.run(`SELECT * FROM users WHERE id = ${uid}`);

    console.log(result);
}

module.exports = {
    hasUser,
};