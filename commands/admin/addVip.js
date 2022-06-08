const { SlashCommandBuilder } = require("@discordjs/builders");
const { userModel } = require("../../models/user");
const { config } = require("../../options");

module.exports = {
	info: {
		name: "set-vip",
		ownerOnly: true,
		slashSettings: new SlashCommandBuilder()
			.setName("set-vip")
			.setDescription("set vip membership to a user")
			.addUserOption((option) =>
				option
					.setName("user")
					.setDescription("Select the wanted user")
					.setRequired(true),
			)
			.addBooleanOption((option) =>
				option
					.setName("state")
					.setDescription("whether give vip or remove vip")
					.setRequired(true),
			),
	},
	async run(client, interaction) {
		const userSelect = interaction.options.getUser("user");
		const vipState = interaction.options.getBoolean("state");
		let user = await userModel.findOne({ "info.discordID": userSelect.id });
		if (!user)
			return interaction.reply({
				content: `user not found`,
			});
		let guild = client.guilds.cache.get(config.guildId);
		let member = await guild.members.fetch(userSelect.id);
		user.info.vip = vipState;
		try {
			if (user.info.vip) {
				await member.roles.add(config.vipRoleId);
			} else {
				await member.roles.remove(config.vipRoleId);
			}
		} catch (err) {
			return interaction.reply({
				content: `❌ | Failed To Give Vip To ${userSelect.username} (${err.message})`,
			});
		}

		await user
			.save()
			.then(() =>
				interaction.reply({
					content: `✅ | Done ${userSelect.username} Is Now ${
						user.info.vip ? "a vip" : "not a vip"
					}`,
				}),
			)
			.catch(() =>
				interaction.reply({
					content: `❌ | Failed To Give Vip To ${userSelect.username}`,
				}),
			);
	},
};
