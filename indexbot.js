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

const startKeyboard = new Keyboard()
  .text('/start')
  .row()
  .text('HTML')
  .text('CSS')
  .row()
  .text('JavaScript')
  .text('React')
  .row()
  .text('ReactNative')
  .row()
  .text('պատահական հարց')
  .row()
  .text('Իմ առաջընթացը')
  .row()
  .text('Առաջատար աղյուսակ')
  .resized();

bot.command('start', async (ctx) => {
  await ctx.reply(
    'Ողջույն: Ես՝ JSInstructorBot եմ    🤖 \n Ես այստեղ եմ, որպեսզի օգնենք քեզ կատարելագործել JavaScript-ի գիտելիքներդ:',
  );
  await ctx.replyWithAnimation('https://t.me/CodeRedHub/18', {
    reply_markup: startKeyboard,
  });

  await ctx.reply(
    '👉 Check out our latest content for more web development tips and tricks! 💻✨ [link](https://t.me/javascripttricktips)',
    { parse_mode: 'Markdown' }
  );
  
  await ctx.reply(
    'Ցանկին կարող եք Ծանոթանալ այս կոճակով          👇',
  );

});

bot.hears(
  ['HTML', 'CSS', 'JavaScript', 'React', 'ReactNative', 'պատահական հարց'],
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
          'Իմանալ Պատասխանը',
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
      await ctx.reply(`Սխալ: ${error.message}`);
    }
  },
);

bot.hears('Իմ առաջընթացը', async (ctx) => {
  const progress = getUserProgress(ctx.from.id);
  await ctx.reply(`Ձեր առաջընթացը:\nВерные ответы: ${progress.correct}\nНеверные ответы: ${progress.incorrect}`);
});

bot.hears('Առաջատար աղյուսակ', async (ctx) => {
  const leaderboard = getLeaderboard();
  let leaderboardText = 'Առաջատար աղյուսակ:\n';
  leaderboard.forEach((user, index) => {
    leaderboardText += `${index + 1}. ${user.username}: ${user.correct} Ճիշտ պատասխան\n`;
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
    await ctx.reply('Ճիշտ է ✅');
    updateUserProgress(userId, true);
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(
    callbackData.type.split('-')[0],
    callbackData.questionId,
  );
  await ctx.reply(`Սխալ է ❌ ճիշտ Պատասխան: ${answer}`);
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
