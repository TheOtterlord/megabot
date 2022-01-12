import { promises as fs } from 'fs'
import type { SlashCommandBuilder } from '@discordjs/builders'
import { Collection, CommandInteraction } from 'discord.js'
import App from '../app'
import { REST } from '@discordjs/rest'
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord-api-types/v9'

export type SlashCommand = {
  data: SlashCommandBuilder
  execute: (app: App, interaction: CommandInteraction) => void
}

/**
 * Manage slash commands in the global scope.
 */
export default class Commands {
  public app: App
  public cache: Collection<string, SlashCommand> = new Collection()
  public listener?: (...args: any[]) => void

  /**
   * Create a new command handler
   */
  constructor(app: App) {
    this.app = app
  }

  /**
   * Register global commands
   * 
   * This will register all files that match `cmd.*.ts` as slash commands.
   * This will also register `listener.ts` as a listener if it exists.
   */
  async loadGlobal() {
    const files = await fs.readdir(`${__dirname}/../commands`)

    for (const file of files) {
      if (file.startsWith('cmd.')) {
        const command: SlashCommand = require(`../commands/${file}`).default
        this.cache.set(command.data.name, command)
        this.app.log.verbose(`Loaded global command ${command.data.name}`)
      } else if (file === 'listener.js') {
        this.listener = require(`../commands/${file}`)
        this.app.log.verbose(`Loaded global listener`)
      } else {
        this.app.log.warn(`Unknown file '${file}' in global module`)
      }
    }

    this.app.log.debug(`Loaded global module`)
  }

  async updateGlobal() {
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = []

    for (const [,command] of this.cache) {
      commands.push(command.data.toJSON())
    }

    const rest = new REST({ version: '9' }).setToken(this.app.token)

    try {
      this.app.log.verbose(`GLOBAL Refreshing application commands`)

      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commands },
      )

      this.app.log.verbose(`GLOBAL Successfully reloaded application commands`)
    } catch (err: any) {
      this.app.log.error(`${err.name}: ${err.message}\n${err.stack}`)
    }
  }

  startListeners() {
    this.app.client.on('interactionCreate', interaction => {
      if (!interaction.isCommand()) return

      if (interaction.guildId && this.app.moduleManager.hasAccessToCommand(interaction.guildId, interaction.commandName)) {
        this.app.log.verbose(`Received /${interaction.commandName} from ${interaction.guild?.name}`)
        this.app.moduleManager.findCommand(interaction.commandName)?.execute(this.app, interaction)
      }

      if (this.cache.has(interaction.commandName)) {
        this.app.log.verbose(`Received /${interaction.commandName} from ${interaction.guild?.name ?? 'DM'}`)
        this.cache.get(interaction.commandName)?.execute(this.app, interaction)
      }
    })

    this.app.client.on('messageCreate', msg => {
      if (msg.author.bot) return

      if (msg.channel.type === 'DM') {
        this.app.log.verbose(`Received DM from ${msg.author.username}`)
        return this.listener?.(this.app, msg)
      }

      for (const [,module] of this.app.moduleManager.modules) {
        if (msg.guildId && module.listener && this.app.moduleManager.hasAccessToModule(msg.guildId, module.name)) module.listener(msg)
      }
    })

    // when the bot joins a guild, update the commands & module data
    this.app.client.on('guildCreate', guild => {
      this.app.log.debug(`Joined guild ${guild.name}`)
      this.app.moduleManager.update(guild.id)
    })
  }
}
