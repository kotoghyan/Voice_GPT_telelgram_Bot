import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import config from 'config';
import { ogg } from './ogg.js';
import { openAi } from "./openAI.js";

const INITIAL_SESSION = {
	message: [],
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

bot.use(session())

bot.command('new', async (ctx) => {
	ctx.sesion = INITIAL_SESSION
	await ctx.reply('Жду вашего Собшения')
})
bot.command('start', async (ctx) => {
	ctx.sesion = INITIAL_SESSION
	await ctx.reply('Жду вашего Собшения')
})

bot.on(message('voice'), async (ctx) => {
	ctx.sesion ??= INITIAL_SESSION
	try {
		await ctx.reply(code('Waiting response from server'))
		const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
		const userId = String(ctx.message.from.id);
		const oggPath = await ogg.create(link.href, userId);
		const mp3Path = await ogg.toMp3(oggPath)

		const text = await openAi.transcription(mp3Path);


		ctx.sesion.message.push({ role: openAi.roles.USER, content: `${text} пиши на русском` })

		const response = await openAi.chat(ctx.sesion.message)

		ctx.sesion.message.push({
				role: openAi.roles.ASSISTANT,
				content: response.content
		})

		await ctx.reply(response.content)

	} catch (e) {
		console.log('Error Message', e.message)
	}
})

bot.on(message('text'), async (ctx) => {
	ctx.sesion ??= INITIAL_SESSION
	try {
		await ctx.reply(code('Waiting response from server'))

		ctx.sesion.message.push({
			role: openAi.roles.ASSISTANT,
			content:ctx.message.text
		})
		const response = await openAi.chat(ctx.sesion.message)

		ctx.sesion.message.push({
				role: openAi.roles.ASSISTANT,
				content:response.content
		})

		await ctx.reply(response.content)

	} catch (e) {
		console.log('Error Message', e.message)
	}
})
bot.launch()


process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

console.log(Telegraf)
