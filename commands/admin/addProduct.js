const { SlashCommandBuilder } = require("@discordjs/builders");
const { productsModel } = require("../../models/products");
const { v4 } = require("uuid");
const { MessageEmbed } = require("discord.js");

module.exports = {
	info: {
		name: "add-product",
		ownerOnly: true,
		slashSettings: new SlashCommandBuilder()
			.setName("add-product")
			.setDescription("add a product")
			.addStringOption((option) =>
				option
					.setName("title")
					.setDescription("the product title")
					.setRequired(true),
			)
			.addStringOption((option) =>
				option
					.setName("description")
					.setDescription("the product description")
					.setRequired(true),
			)
			.addStringOption((option) =>
				option
					.setName("image")
					.setDescription("the product image URL")
					.setRequired(true),
			)
			.addIntegerOption((option) =>
				option
					.setName("price")
					.setDescription("the product price")
					.setRequired(true),
			)
			.addBooleanOption((option) =>
				option
					.setName("code")
					.setDescription("whether the product is a code or an email")
					.setRequired(true),
			),
	},
	async run(client, interaction) {
		const title = interaction.options.getString("title");
		const description = interaction.options.getString("description");
		const imageURL = interaction.options.getString("image");
		const code = interaction.options.getBoolean("code");
		const price = interaction.options.getInteger("price");
		let newProduct = await productsModel.create({
			id: v4(),
			title: title,
			imageURL: imageURL,
			price: price,
			description: description,
			isCode: code,
			stock: [],
			createdAt: new Date(),
		});

		let embed = new MessageEmbed()
			.setTitle(`Product Title: ${newProduct.title}`)
			.setImage(newProduct.imageURL)
			.setDescription(
				`**Description: ${newProduct.description}\nPrice: \`$${newProduct.price}\`\nProduct ID: \`${newProduct.id}\`**`,
			)
			.setFooter({
				text: client.user.username,
				iconURL: client.user.avatarURL(),
			})
			.setColor("GREEN")
			.setTimestamp(newProduct.createdAt);
		interaction.reply({
			content: `✅ | Done Added \`${newProduct.title}\` !`,
			embeds: [embed],
		});
	},
};
