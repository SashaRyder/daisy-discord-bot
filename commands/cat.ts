import { CommandInterface } from "./CommandInterface";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import axios from "axios";


const execute = async (interaction: CommandInteraction) => {
  const { data } = await axios.get(
    "https://api.thecatapi.com/v1/images/search"
  );

  await interaction.reply(data[0].url);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cat")
    .setDescription("Returns a picture of a cat"),
  execute,
} as CommandInterface;
