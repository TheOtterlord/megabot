import { config } from 'dotenv'
import { ShardingManager } from 'discord.js'

config()

const manager = new ShardingManager(`${__dirname}/index.js`, { token: process.env.TOKEN! });

manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));
manager.spawn();

export {}
