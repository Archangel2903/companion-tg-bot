// const { Configuration, OpenAIApi } = require("openai");

const statement = {
    openai_handler: true,
};

function gpt(bot, apiKey, creatorId) {
    const openai = new OpenAIApi(new Configuration({ apiKey }));

    bot.onText(/^!(.+)/gi, async (msg, match) => {
        if (!statement.openai_handler) return;
        if (msg.from.id !== creatorId) return;

        statement.openai_handler = false;  // Блокируем обработку других запросов
        const { from: { first_name }, chat: { id: chatId } } = msg;
        const text = match[1];

        console.log(`${first_name}: Спрашивает "${text}"`);

        try {
            const response = await sendMessageToChatGPT(openai, text);
            await bot.sendMessage(chatId, response);
        } catch (error) {
            console.error('Ошибка при запросе к ChatGPT:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка при получении ответа. Попробуй позже.');
        } finally {
            statement.openai_handler = true;  // Разрешаем обработку новых запросов
        }
    });
}

async function sendMessageToChatGPT(openai, message) {
    const response = await openai.createCompletion({
        model: 'gpt-4o-mini',
        prompt: message,
        max_tokens: 150,
        temperature: 0.7,
    });

    return response.data.choices[0].text.trim();
}

module.exports = { gpt };
