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
					.setRequired(false),
			)
			.addStringOption((option) =>
				option
					.setName("title")
					.setDescription("The Product Title")
					.setRequired(false),
			),
	},
	async run(client, interaction) {
		const productID = interaction.options.getString("id");
		const productTitle = interaction.options.getString("title");

		if (!productID && !productTitle)
			return interaction.reply({
				content: "You Need to give me the product title or id",
			});

		await interaction.deferReply();
		let queryOptions = {};
		if (productID) queryOptions.id = productID.trim();
		if (productTitle) queryOptions.title = productTitle.trim();
		let product = await productsModel.findOne(queryOptions);
		if (!product)
			return interaction.reply({
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
