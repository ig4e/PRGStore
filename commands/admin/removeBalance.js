const { SlashCommandBuilder } = require("@discordjs/builders");
const { userModel } = require("../../models/user");

module.exports = {
	info: {
		name: "remove-balance",
        ownerOnly: true,
		slashSettings: new SlashCommandBuilder()
			.setName("remove-balance")
			.setDescription("remove balance from a user")
			.addUserOption((option) =>
				option
					.setName("user")
					.setDescription("select a user to remove balance")
					.setRequired(true),
			)
			.addIntegerOption((option) =>
				option
					.setName("amount")
					.setDescription("the amount to remove")
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
		user.balance -= Number(amount);
		await user
			.save()
			.then(() =>
				interaction.reply({
					content: `Done Removed \`${Number(amount)}$\` from ${
						user.info.username
					} `,
				}),
			)
			.catch(() =>
				interaction.reply({
					content: `Failed to remove \`${Number(
						amount,
					)}$\` from ${userSelect}`,
				}),
			);
	},
};
