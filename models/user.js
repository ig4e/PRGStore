const mongoose = require("mongoose");

const authProvider = new mongoose.Schema({
	accessToken: { type: String, defualt: null },
	refreshToken: { type: String, defualt: null },
});

const userModel = mongoose.model(
	"user",
	mongoose.Schema({
		id: { type: String, required: true },
		info: {
			username: { type: String, required: true },
			discordID: { type: String, defualt: null },
			email: { type: String, required: true },
			password: { type: String, defualt: null },
			vip: { type: Boolean, default: false },
			createdAt: { type: Date, defualt: Date.now },
		},
		auth: {
			accessToken: { type: String, defualt: null },
			discord: authProvider,
			google: authProvider,
		},
		balance: { type: Number, default: 0 },
		orders: [
			{
				id: { type: String, required: true },
				productID: { type: String, required: true },
				createdAt: { type: Date, defualt: Date.now },
				completed: { type: Boolean, default: false },
				orderData: {
					email: String,
					password: String,
					code: String,
				},
			},
		],
	}),
);

module.exports = { userModel };
