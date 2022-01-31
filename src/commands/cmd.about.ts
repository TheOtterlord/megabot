import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import App from '../app'

export default {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('About the bot')
		.addSubcommand(subcommand => subcommand
			.setName('bot')
			.setDescription('Info about the discord bot'))
		.addSubcommand(subcommand => subcommand
			.setName('developer')
			.setDescription('Info about the bot developer(s)')),
	async execute(app: App, interaction: CommandInteraction) {
		try {
			if (interaction.options.getSubcommand() === 'developer') {
				// @todo add developer info
				interaction.reply('The bot was developed by the following developers: Otterlord')
			} else if (interaction.options.getSubcommand() === 'bot') {
				// @todo add bot info
				interaction.reply(`This is a template bot with minimal functionality. Check out the source code at https://github.com/TheOtterLord/megabot`)
			}
		} catch (err: any) {
      app.log.error(`${err.name}: ${err.message}\n${err.stack}`)
      interaction.reply('Something went wrong!')
		}
	}
}
