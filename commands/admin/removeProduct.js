const { SlashCommandBuilder } = require("@discordjs/builders");
const { productsModel } = require("../../models/products");

module.exports = {
	info: {
		name: "remove-product",
		ownerOnly: true,
		slashSettings: new SlashCommandBuilder()
			.setName("remove-product")
			.setDescription("Removes a Product")
			.addStringOption((option) =>
				option
					.setName("id")
					.setDescription("The Product ID")
					.setRequired(true),
			),
	},
	async run(client, interaction) {
		const productID = interaction.options.getString("id");
		let product = await productsModel.findOne({
			id: productID,
		});
        if (!product) return interaction.reply({
			content: `❌ | This Product Does'nt Exist!`,
		});
		await productsModel.deleteOne({
			id: productID,
		});
		return interaction.reply({
			content: `✅ | Done Deleted \`${product?.title}\` !`,
		});
	},
};
