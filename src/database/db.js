const sqlite = require('sqlite-sync');
const { log } = require('../utils/helpers');
const path = require('path');
const DB_PATH = path.resolve(__dirname, '../../database.db');

/**/
sqlite.connect(DB_PATH);

function query(sql, params = []) {
    try {
        return sqlite.run(sql, params);
    }
    catch (error) {
        log('DB ERROR')(error.message);
        throw error;
    }
}
function initializeTable() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER UNIQUE NOT NULL,
            firstname TEXT NOT NULL,
            username TEXT,
            user_coins INTEGER DEFAULT 100
         );`,
        `CREATE TABLE IF NOT EXISTS words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL
         )`,
        `CREATE TABLE IF NOT EXISTS words_ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT UNIQUE,
            likes INTEGER DEFAULT 0,
            dislikes INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS words_top (
            chat_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            user_name TEXT NOT NULL,
            rating INTEGER DEFAULT 0,
            UNIQUE(chat_id, user_id)
        )`,
        `CREATE TABLE IF NOT EXISTS warns (
            user_id INTEGER UNIQUE NOT NULL,
            warn_count INTEGER
         )`
    ];

    queries.forEach((sql) => query(sql));
    log('INFO')('Таблицы успешно инициализированы');
}

module.exports = { query, initializeTable, sqlite }