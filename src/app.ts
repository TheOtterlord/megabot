import { Client, Intents } from 'discord.js'
import { createLogger, format, Logger, transports } from 'winston'
import Commands from './classes/commands'
import Guilds from './classes/guilds'
import Modules from './classes/modules'

/**
 * The main class of the bot.
 */
export default class App {
  client: Client
  shardId: number | undefined
  token: string
  moduleManager = new Modules(this)
  guildManager = new Guilds(this)
  commands = new Commands(this)

  log: Logger

  started = false

  constructor(token: string) {
    this.token = token

    this.log = createLogger({
      level: process.env.DEV ? 'debug' : 'info',
      format: format.combine(
        format.errors({ stack: true }),
        format.colorize(),
        format.timestamp(),
        format.printf(info => `[${info.timestamp}](${this.shardId}) ${info.level}: ${info.stack || info.message}`),
      ),
      transports: [
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.Console()
      ],
    })

    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
      ]
    })
  }

  async start() {
    this.client.on('ready', () => {
      this.shardId = this.client.guilds.cache.first()?.shardId
      this.log.info(`Started bot: ${this.client.user?.tag}`)
    })
    await this.client.login(this.token)
    this.started = true

    this.moduleManager.load()
    this.moduleManager.updateMany(this.client.guilds.cache.map(g => g.id))
    this.commands.loadGlobal()
    this.commands.updateGlobal()
    this.commands.startListeners()
  }

  async stop(event: string, error: Error) {
    if (!this.started) return
    this.started = false

    if (error) this.log.error(error)
    this.client.destroy()
    this.log.info('Stopped bot with event: '+event)
  }
}
