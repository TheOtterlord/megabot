import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import App from '../../app'

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Test the bot is interacting with Discord'),
	async execute(app: App, interaction: CommandInteraction) {
		try {
      interaction.reply({
        content: 'Pong!'
      })
		} catch (err: any) {
      app.log.error(`${err.name}: ${err.message}\n${err.stack}`)
      interaction.reply('Something went wrong!')
		}
	}
}
