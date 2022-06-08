const { SlashCommandBuilder } = require("@discordjs/builders");
const { userModel } = require("../../models/user");

module.exports = {
	info: {
		name: "add-balance",
		ownerOnly: true,
		slashSettings: new SlashCommandBuilder()
			.setName("add-balance")
			.setDescription("Add a fixed amount to a user balance")
			.addUserOption((option) =>
				option
					.setName("user")
					.setDescription("Select the wanted user")
					.setRequired(true),
			)
			.addIntegerOption((option) =>
				option
					.setName("amount")
					.setDescription("Enter the amount to add")
					.setRequired(true),
			),
	},
	async run(client, interaction) {
		const userSelect = interaction.options.getUser("user");
		const amount = interaction.options.getInteger("amount");
		let user = await userModel.findOne({ "info.discordID": userSelect.id });
		if (!user)
			return interaction.reply({
				content: `user not found`,
			});
		user.balance += Number(amount);
		await user
			.save()
			.then(() =>
				interaction.reply({
					content: `✅ | Done ${
						userSelect.username
					} Balance \`+${Number(amount)}\``,
				}),
			)
			.catch(() =>
				interaction.reply({
					content: `❌ | Failed To Give The Amount To ${userSelect.username}`,
				}),
			);
	},
};
