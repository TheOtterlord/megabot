import { Client, Intents } from 'discord.js'
import { createLogger, format, Logger, transports } from 'winston'

export default class App {
  client: Client
  token: string

  log: Logger = createLogger({
    level: process.env.DEV ? 'debug' : 'info',
    format: format.combine(
      format.timestamp(),
      format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    defaultMeta: { service: 'bot' },
    transports: [
      new transports.File({ filename: 'error.log', level: 'error' }),
      new transports.Console()
    ],
  })

  started = false

  constructor(token: string) {
    this.token = token

    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
      ]
    })
  }

  async start() {
    this.client.on('ready', () => {
      this.log.info(`Started bot: ${this.client.user?.tag}`)
    })

    await this.client.login(this.token)
    this.started = true
  }

  async stop(event: string, error: Error) {
    if (!this.started) return
    this.started = false

    if (error) this.log.error(error)
    this.client.destroy()
    this.log.info('Stopped bot with event: '+event)
  }
}
