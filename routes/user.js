const express = require("express");
const router = express.Router();
const { userModel } = require("../models/user");
const { productsModel } = require("../models/products");
const { v4 } = require("uuid");
const _ = require("lodash");
const { config } = require("../options");
const { gmailTransporter } = require("../email/gmailTransport");

/*
var check = await client.probot.collect(message, {
      probotId: `567703512763334685`,
      owners: ["496941648576643092"],
      time: 1000 * 60 * 5, // 5 min
      userId: message.author.id, // when you not specify the user, return full collection for first transfer in main channel.
      price: 5000, 
      fullPrice: true // member must send the price with tax
});
*/

function setupRouter(client) {
	router.post("/user/deposit", checkAuth, async (req, res) => {
		try {
			let { user } = req;
			let {
				userDiscordId = user.info.discordID,
				amount,
				withTax = true,
			} = req.body;
			if (!userDiscordId)
				return res.status(400).json({
					status: 400,
					error: "user discord id wasn't provided",
				});
			if (!amount)
				return res
					.status(400)
					.json({ status: 400, error: "amount wasn't provided" });

			let message = await client.sendToTransferChannel({
				content: `**<@${userDiscordId}>, You Have To Transfer \`${
					withTax ? client.tax(amount) : amount
				}$\` Credits To ${config.owners
					.map((ownerID) => `<@${ownerID}> (${ownerID})`)
					.join(",")} In 5m**`,
			});

			let member = await message.guild.members.fetch(userDiscordId);
			let checkTransfer = await client.probot.waitForTransfer(message, {
				amount,
				transferorID: userDiscordId,
				withTax,
				receiverIDs: config.owners,
			});

			if (checkTransfer.hasTransferredTheFullPrice) {
				user.balance += checkTransfer.receviedAmount;
				let messageContent = `**<@${userDiscordId}>, Done Your New Balance Is \`$${user.balance}\`**`;
				if (member) {
					member.send({
						content: messageContent,
					});
				} else {
					await client.sendToTransferChannel({
						content: messageContent,
					});
				}
			} else {
				user.balance += checkTransfer.receviedAmount;
				let messageContent = `**<@${userDiscordId}>, You Didn't Transfer The Required Amount So i Gave You \`$${checkTransfer.receviedAmount}\`**`;
				if (member) {
					member.send({
						content: messageContent,
					});
				} else {
					await client.sendToTransferChannel({
						content: messageContent,
					});
				}
			}

			await user.save();
			res.status(200).json({ status: 200, balance: user.balance });
		} catch (err) {
			res.status(500).json({ status: 500, error: err });
		}
	});

	router.get("/user", checkAuth, async (req, res) => {
		let { user } = req;
		res.json({
			status: 200,
			id: user.id,
			info: user.info,
			balance: user.balance,
		});
	});

	let codes = [];
	let vCodeGenerator = () =>
		[0, 1, 2, 3, 4]
			.map((_) => String(Math.floor(Math.random() * 9)))
			.join("");
	router.get("/user/verify", checkAuth, async (req, res) => {
		try {
			let { user } = req;
			let { code } = req.query;
			if (!code) {
				let vCode = vCodeGenerator();
				codes = codes.filter((code) => code.email != user.info.email);
				codes.push({ email: user.info.email, code: vCode });
				let mailOptions = {
					from: "prgstoretest@gmail.com",
					to: user.info.email,
					subject: "PRG - Store Account Verify",
					html: `<h1>Account Verifcation Code: ${vCode}</h1><h2>Thanks For Choosing Us</h2>`,
				};
				gmailTransporter.sendMail(mailOptions, (err, info) => {
					if (err)
						return res.json({
							status: 500,
							message: "error in sending the verifcation code",
						});
					return res.json({
						status: 200,
						message: "verifcation code has been sent",
					});
				});
			} else {
				let checkCode = codes.find(
					(lCode) =>
						lCode.email == user.info.email && lCode.code == code,
				);
				if (checkCode) {
					user.info.verified = true;
					await user.save();
					return res.json({
						status: 200,
						message: "the user's email address is now verified",
					});
				} else {
					codes = codes.filter(
						(code) => code.email != user.info.email,
					);
					return res.json({
						status: 200,
						message: "invaild verifcation code",
					});
				}
			}
		} catch (err) {
			console.log(err);
			return res.json({
				status: 500,
				message: "server error",
			});
		}
	});

	/*
	 
	products: [{
		id: String,
		amount: Number
	}]

	*/

	router.post("/user/order", checkAuth, async (req, res) => {
		let { user } = req;
		let { products } = req.body;
		let dbProducts = await productsModel.find({
			id: { $in: products.map((product) => product.id) },
		});
		let totalPrice = dbProducts.reduce(
			(total, current) =>
				(total += user.info.vip
					? current.price - current.price * 0.1
					: current.price),
			0,
		);
		if (user.balance >= totalPrice) {
			for (let product of dbProducts) {
				let { amount } =
					products.find((prod) => prod.id == product.id) || {};
				if (!amount)
					return res.json({
						status: 400,
						error: "Error In Order Request Params",
					});
				if (product.stock.length >= amount) {
					let boughtProducts = product.stock.slice(0, amount);
					boughtProducts.forEach((p) =>
						user.orders.push({
							id: p.id,
							productID: product.id,
							createdAt: new Date(),
							completed: true,
							orderData: {
								email: p.email,
								password: p.password,
								code: p.code,
							},
						}),
					);
					product.stock = product.stock.filter(
						(stock) =>
							!boughtProducts.map((_) => _.id).includes(stock.id),
					);
					product.stockCount = product.stock.length;
					user.balance -= totalPrice;
					await product.save();
					await user.save();
				} else {
					return res.json({
						status: 200,
						error: "No Stock",
					});
				}
			}
			return res.json({
				status: 400,
				message: "Done Check Your Orders(Inventory)",
			});
		} else {
			res.json({
				status: 403,
				error: "Your balance isn't enough to buy this products",
			});
		}
	});

	router.get("/user/orders", checkAuth, async (req, res) => {
		let { user } = req;
		res.json({ status: 200, id: user.id, orders: user.orders });
	});

	async function checkAuth(req, res, next) {
		let { authorization } = req.headers;
		if (!authorization)
			return res
				.status(403)
				.json({ status: 403, error: "invaild token" });
		let user = await userModel.findOne({
			"auth.accessToken": authorization.replace("Bearer ", ""),
		});
		if (user) {
			req.user = user;
			next();
		} else {
			res.status(403).json({ status: 403, error: "invaild token" });
		}
	}

	return router;
}
module.exports = setupRouter;
