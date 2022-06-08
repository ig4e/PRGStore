const { SlashCommandBuilder } = require("@discordjs/builders");
const { productsModel } = require("../../models/products");
const { v4 } = require("uuid");
const { MessageEmbed } = require("discord.js");
const { default: axios } = require("axios");

module.exports = {
	info: {
		name: "add-product-stock",
		ownerOnly: true,
		slashSettings: new SlashCommandBuilder()
			.setName("add-product-stock")
			.setDescription("Adds Product Stock From a .txt File")
			.addStringOption((option) =>
				option
					.setName("id")
					.setDescription("The Product ID")
					.setRequired(true),
			)
			.addAttachmentOption((option) =>
				option
					.setName("attachment")
					.setDescription(
						"Attach accounts.text (email:passowrd) OR codes.txt (code)",
					)
					.setRequired(true),
			),
	},
	async run(client, interaction) {
		const productID = interaction.options.getString("id");
		const { name, url } = interaction.options.getAttachment("attachment");
		if (!name.endsWith(".txt"))
			return interaction.reply({
				content: "❌ | Error The Attachment Nust Be a .txt File",
			});
		let product = await productsModel.findOne({
			id: productID,
		});
		if (!product)
			return interaction.reply({
				content: `❌ | This Product Does'nt Exist!`,
			});
		const isCode = product.isCode;
		let textContent = await axios.get(url).then((res) => res.data);
		let totalAdded = 0;
		if (isCode) {
			textContent.split("\n").map(
				(code) =>
					product.stock.push({
						id: v4(),
						code: code.trim(),
						createdAt: new Date(),
					}),
				totalAdded++,
			);
		} else {
			textContent.split("\n").map((account) => {
				let [email, password] = account.split(":");
				product.stock.push({
					id: v4(),
					email: email,
					password: password,
					createdAt: new Date(),
				});
				totalAdded++;
			});
		}

		await product.save();
		interaction.reply({
			content: `✅ | Done Added ${totalAdded} ${
				isCode ? "Codes" : "Accounts"
			} To ${product.title}.\n${product.title}'s Stock: ${
				product.stock.length
			}`,
		});
	},
};
