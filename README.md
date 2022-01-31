# Megabot

The ultimate Discord.js bot template.

## Features

This template has many features that make bot development easier and faster.

### Modules

Commands and [listeners](#listeners) are organised into collections called "modules". You can toggle which guilds have access to different modules using the database, or your own API.

### Global Commands

Global commands exist in the `./commands` directory and are seperate from modules as anyone can run these commands.

### Listeners

Listeners can be added to modules to listen for text messages, and perform actions related to them. Global listeners only apply to DMs where as module listeners apply to all guilds that have access to that module.

### Sharding

This bot support sharding, although it does not currently support sharding on multiple machines. To do this, you'll need to create a custom solution as `discord.js` does not have a builtin solution.

## @todo

`@todo` statements are found in files that you may wish to change. For example, anything related to the database has an `@todo` comment, in case you wish to replace it with a different TypeORM, database client or even an API request to your own backend.
