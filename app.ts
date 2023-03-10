import { Client, Collection, Events, Partials, REST, Routes } from "discord.js";
import path from "path";
import { startServer } from "./server";
import { clientReady, guildCreate } from "./functions";
import fs from "fs";
import { CommandInterface } from "./commands/CommandInterface";

const { DISCORD_TOKEN } = process.env;

global["appRoot"] = path.resolve(__dirname);

const client = new Client({ partials: [Partials.Channel], intents: 32767 });

const commands = [];

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath) as CommandInterface;
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

client.on("ready", async () => {
  clientReady(client);
  // Construct and prepare an instance of the REST module
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = (await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    })) as { length: number };

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
});

client.on("guildCreate", (guild) => guildCreate(guild, client));

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.on("error", (err) => {
  console.log(err.name);
});

client.login(DISCORD_TOKEN);
startServer();
