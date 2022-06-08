module.exports = async (client, guildId, token) => {
	const { REST } = require("@discordjs/rest");
	const { Routes } = require("discord-api-types/v9");

	const commands = client.commands.map((command) => command.info.slashSettings.toJSON());
	const rest = new REST({ version: "9" }).setToken(token);
	rest.put(Routes.applicationGuildCommands(client.user.id, guildId), {
		body: commands,
	})
		.then(() =>
			console.log("Successfully registered application commands."),
		)
		.catch(console.error);
};
