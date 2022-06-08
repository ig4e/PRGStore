const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	info: {
		name: "ping",
        ownerOnly: false,
		slashSettings: new SlashCommandBuilder()
			.setName("ping")
			.setDescription("bot ping"),
	},
	async run(client, interaction) {
		return interaction.reply({
			content: `My Ping Is: ${client.ws.ping}ms`,
		});
	},
};
