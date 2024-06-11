require('dotenv').config();
const {
  Bot,
  Keyboard,
  InlineKeyboard,
  GrammyError,
  HttpError,
} = require('grammy');
const { getRandomQuestion, getCorrectAnswer } = require('./utils');
const { getUserProgress, updateUserProgress, getLeaderboard } = require('./userProgress');

const bot = new Bot(process.env.BOT_API_KEY);

bot.command('start', async (ctx) => {
  const startKeyboard = new Keyboard()
    .text('HTML')
    .text('CSS')
    .row()
    .text('JavaScript')
    .text('React')
    .row()
    .text('ReactNative')
    .row()
    .text('Случайный вопрос')
    .row()
    .text('Мой прогресс')
    .row()
    .text('Таблица лидеров')
    .resized();
  await ctx.reply(
    'Привет! Я - Frontend Interview Prep Bot 🤖 \nЯ помогу тебе подготовиться к интервью по фронтенду',
  );
  await ctx.reply('С чего начнем? Выбери тему вопроса в меню 👇', {
    reply_markup: startKeyboard,
  });
});

bot.hears(
  ['HTML', 'CSS', 'JavaScript', 'React', 'ReactNative', 'Случайный вопрос'],
  async (ctx) => {
    const topic = ctx.message.text.toLowerCase();

    try {
      const { question, questionTopic } = getRandomQuestion(topic);

      let inlineKeyboard;

      if (question.hasOptions) {
        const buttonRows = question.options.map((option) => [
          InlineKeyboard.text(
            option.text,
            JSON.stringify({
              type: `${questionTopic}-option`,
              isCorrect: option.isCorrect,
              questionId: question.id,
            }),
          ),
        ]);

        inlineKeyboard = InlineKeyboard.from(buttonRows);
      } else {
        inlineKeyboard = new InlineKeyboard().text(
          'Узнать ответ',
          JSON.stringify({
            type: questionTopic,
            questionId: question.id,
          }),
        );
      }

      await ctx.reply(question.text, {
        reply_markup: inlineKeyboard,
      });
    } catch (error) {
      await ctx.reply(`Ошибка: ${error.message}`);
    }
  },
);

bot.hears('Мой прогресс', async (ctx) => {
  const progress = getUserProgress(ctx.from.id);
  await ctx.reply(`Ваш прогресс:\nВерные ответы: ${progress.correct}\nНеверные ответы: ${progress.incorrect}`);
});

bot.hears('Таблица лидеров', async (ctx) => {
  const leaderboard = getLeaderboard();
  let leaderboardText = 'Таблица лидеров:\n';
  leaderboard.forEach((user, index) => {
    leaderboardText += `${index + 1}. ${user.username}: ${user.correct} верных ответов\n`;
  });
  await ctx.reply(leaderboardText);
});

bot.on('callback_query:data', async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data);
  const userId = ctx.from.id;

  if (!callbackData.type.includes('option')) {
    const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
    await ctx.reply(answer, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  if (callbackData.isCorrect) {
    await ctx.reply('Верно ✅');
    updateUserProgress(userId, true);
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(
    callbackData.type.split('-')[0],
    callbackData.questionId,
  );
  await ctx.reply(`Неверно ❌ Правильный ответ: ${answer}`);
  updateUserProgress(userId, false);
  await ctx.answerCallbackQuery();
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

bot.start();
