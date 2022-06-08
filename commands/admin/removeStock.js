const { SlashCommandBuilder } = require("@discordjs/builders");
const { productsModel } = require("../../models/products");
const { v4 } = require("uuid");
const { MessageEmbed } = require("discord.js");
const { default: axios } = require("axios");

module.exports = {
	info: {
		name: "remove-product-stock",
		ownerOnly: true,
		slashSettings: new SlashCommandBuilder()
			.setName("remove-product-stock")
			.setDescription("Adds Product Stock From a .txt File")
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
		let oldStock = product.stockCount;
		product.stock = [];
		product.stockCount = product.stock.length;
		await product.save();
		interaction.editReply({
			content: `✅ | Done Rmoved ${oldStock} ${
				product.isCode ? "Codes" : "Accounts"
			} From ${product.title}.\n${product.title}'s Stock: ${
				product.stock.length
			}`,
		});
	},
};
