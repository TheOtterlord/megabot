import App from '../app'
import prisma from '../prisma'

export type Guild = {
  id: string
  modules: string[]
}

/**
 * The guilds class is used to fetch and store guild data from the db/api.
 */
export default class Guilds {
  app: App

  constructor(app: App) {
    this.app = app
  }

  async get(id: string): Promise<Guild | null> {
    const guild = await prisma.guild.findUnique({
      where: { id }
    })
    return guild
  }

  /**
   * Get many guilds.
   * @param ids The guilds to fetch
   * @returns A list of guilds
   */
  getMany(ids: string[]): Promise<(Guild | null)[]> {
    return Promise.all(ids.map(id => this.get(id)))
  }

  poll() {
    setInterval(() => {
      this.app.log.debug('Polling guilds')

      this.app.client.guilds.cache.forEach(async guild => {
        let changed = false

        let data = await this.app.guildManager.get(guild.id)
        if (!data) data = {id: guild.id, modules: this.app.moduleManager.defaults};
        for (let [,module] of this.app.moduleManager.modules) {
          if (data.modules.includes(module.name) && module.guilds.includes(guild.id)) continue
          if (module.guilds.includes(guild.id)) {
            module.guilds = module.guilds.filter(g => g !== guild.id)
            changed = true
            continue
          }
          module.guilds.push(guild.id)
          changed = true
        }
        if (changed) {
          this.app.log.verbose(`Updating guild due to poll ${guild.id}`)
          await this.app.moduleManager.update(guild.id)
        }
      })
    }, +process.env.POLL_INTERVAL!)
  }
}
