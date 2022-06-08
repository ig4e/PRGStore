const express = require("express");
const router = express.Router();
const { userModel } = require("../models/user");
const { v4 } = require("uuid");
const _ = require("lodash");
const { config } = require("../options.json");
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
