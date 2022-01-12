import { REST } from "@discordjs/rest"
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord-api-types/v9"
import { Collection } from "discord.js"
import { promises as fs } from "fs"
import App from "../app"
import { SlashCommand } from "./commands"

export type Module = {
  name: string
  commands: Collection<string, SlashCommand>
  listener?: (...args: any[]) => void
  guilds: string[]
}

/**
 * Modules are a way to split functionality into smaller pieces that can be enabled/disabled per guild.
 */
export default class Modules {
  app: App
  modules: Collection<string, Module> = new Collection()

  defaults = [
    'misc'
  ]

  constructor(app: App) {
    this.app = app
  }

  /**
   * Load all modules from the modules directory.
   * 
   * This will load all commands and listeners from each module.
   * 
   * @returns A list of loaded modules.
   */
  async load(): Promise<string[]> {
    const modules = await fs.readdir(`${__dirname}/../modules`)

    for (const moduleName of modules) {
      let module: Module = {
        name: moduleName,
        commands: new Collection(),
        guilds: [],
      }
      const files = await fs.readdir(`${__dirname}/../modules/${moduleName}`)

      for (const file of files) {
        if (file.startsWith('cmd.')) {
          const command: SlashCommand = require(`../modules/${moduleName}/${file}`).default
          module.commands.set(command.data.name, command)
          this.app.log.verbose(`Loaded command ${command.data.name} from ${moduleName}`)
        } else if (file === 'listener.js') {
          module.listener = require(`../modules/${moduleName}/${file}`)
          this.app.log.verbose(`Loaded listener from ${moduleName}`)
        } else {
          this.app.log.warn(`Unknown file '${file}' in module '${moduleName}'`)
        }
      }
      
      this.modules.set(moduleName, module)
      this.app.log.debug(`Loaded module ${moduleName}`)
    }
    return modules
  }

  async update(guild: string) {
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = []
    let enabled: string[] = (await this.app.guildManager.get(guild))?.modules ?? []

    if (enabled.length === 0) enabled = this.defaults

    this.modules.forEach((module, name) => {
      if (!enabled.includes(name)) return
      module.guilds.push(guild)

      module.commands.forEach((command, name) => {
        commands.push(command.data.toJSON())
      })
    })

    const rest = new REST({ version: '9' }).setToken(this.app.token)

    try {
      this.app.log.verbose(`${guild} Refreshing application commands`)

      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, guild),
        { body: commands },
      )

      this.app.log.verbose(`${guild} Successfully reloaded application commands`)
    } catch (err: any) {
      this.app.log.error(`${err.name}: ${err.message}\n${err.stack}`)
    }
  }

  updateMany(guilds: string[]) {
    return Promise.all(guilds.map(guild => this.update(guild)))
  }

  findParent(command: string): Module | undefined {
    for (const [,module] of this.modules) {
      if (Array.from(module.commands.keys()).includes(command)) return module
    }
  }

  findCommand(command: string): SlashCommand | undefined {
    const parent = this.findParent(command)
    if (!parent) return
    return parent.commands.get(command)
  }

  hasAccessToCommand(guild: string, command: string): boolean {
    const module = this.findParent(command)
    if (!module) return true
    if (module.guilds.includes(guild)) return true
    return false
  }

  hasAccessToModule(guild: string, module: string): boolean {
    if (this.modules.get(module)?.guilds.includes(guild)) return true
    return false
  }
}
