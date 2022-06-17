const { SlashCommandBuilder } = require("@discordjs/builders");
const { productsModel } = require("../../models/products");
const { v4 } = require("uuid");
const { MessageEmbed } = require("discord.js");
const { encode, decode } = {
	decode: (base64) => Buffer.from(base64, "base64").toString("ascii"),
	encode: (ascii) => Buffer.from(ascii).toString("base64"),
};
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
			)
			.addAttachmentOption((option) =>
				option
					.setName("attachment")
					.setDescription("product image")
					.setRequired(true),
			),
	},
	async run(client, interaction) {
		const title = interaction.options.getString("title");
		const description = interaction.options.getString("description");
		const code = interaction.options.getBoolean("code");
		const price = interaction.options.getInteger("price");
		const interactionAttachment =
			interaction.options.getAttachment("attachment");
		let { attachments } = await interaction.guild.channels.cache
			.get("986732172692054026")
			.send({ files: [interactionAttachment.url] });
		let { url: imageURL } = attachments.first();

		let uploadID = encode(imageURL.split("attachments/")[1]);

		let newProduct = await productsModel.create({
			id: v4(),
			title: title,
			imageURL: uploadID,
			price: price,
			description: description,
			isCode: code,
			stockCount: 0,
			stock: [],
			createdAt: new Date(),
		});

		let embed = new MessageEmbed()
			.setTitle(`Product Title: ${newProduct.title}`)
			.setImage(imageURL)
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
