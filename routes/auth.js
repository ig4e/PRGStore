const express = require("express");
const router = express.Router();
const DiscordOauth2 = require("discord-oauth2");
const { client } = require("../options");
const { userModel } = require("../models/user");
const { v4 } = require("uuid");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const rateLimit = require("express-rate-limit");
const { gmailTransporter } = require("../email/gmailTransport");
const loginLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
});

const oauth = new DiscordOauth2({
	clientId: client.id,
	clientSecret: client.secret,
	redirectUri: client.redirectUri,
});

router.post("/login", loginLimiter, async (req, res) => {
	try {
		let { email, password } = req.body;
		if (!email)
			return res
				.status(400)
				.json({ status: 400, error: "no email provided." });
		if (!password)
			return res
				.status(400)
				.json({ status: 400, error: "no password provided." });

		let user = await userModel.findOne({ "info.email": email });
		if (!user)
			return res.status(400).json({
				status: 400,
				error: "account doesn't exsit.",
			});

		let success = await bcrypt.compare(password, user.info.password);
		if (success) {
			user.auth.accessToken = v4();
			await user.save();
			res.json({ status: 200, accessToken: user.auth.accessToken });
		} else {
			res.status(400).json({
				status: 400,
				error: "invaild email/password.",
			});
		}
	} catch (err) {
		res.status(500).json({ status: 500, error: err.stack });
	}
});

router.post("/register", async (req, res) => {
	try {
		let { username, email, password, discordID } = req.body;

		if (!username)
			return res
				.status(400)
				.json({ status: 400, error: "no username provided." });
		if (!email)
			return res
				.status(400)
				.json({ status: 400, error: "no email provided." });
		if (!password)
			return res
				.status(400)
				.json({ status: 400, error: "no password provided." });

		let ifUserExsits = await userModel.findOne({ "info.email": email });
		if (ifUserExsits)
			return res.status(400).json({
				status: 400,
				error: "a user with this email address already exsits.",
			});

		let user = await userLogin({
			username: username,
			email: email,
			password: password,
			discordID: discordID,
		});

		res.json({ status: 200, accessToken: user.auth.accessToken });
	} catch (err) {
		res.status(500).json({ status: 500, error: err.stack });
	}
});

router.get("");

router.get("/discord", async (req, res) => {
	try {
		let { code } = req.query;
		if (!code) return res.sendStatus(403);
		let { access_token, refresh_token } = await oauth.tokenRequest({
			code: code,
			scope: "identify email",
			grantType: "authorization_code",
		});
		let { id, email, username } = await oauth.getUser(access_token);

		let user = await userLogin({
			username,
			email,
			discordID: id,
			discordAuth: {
				accessToken: access_token,
				refreshToken: refresh_token,
			},
		});

		res.json({ status: 200, accessToken: user.auth.accessToken });
	} catch (err) {
		res.status(500).json({ status: 500, error: err.stack });
	}
});

/*
router.get("/google", async (req, res) => {
	try {
		let { code } = req.query;
		if (!code) return res.sendStatus(403);

		let userData = await verifyGoogleToken(code);

		let user = await userLogin({
			username,
			email,
			discordID: id,
			discordAuth: {
				accessToken: access_token,
				refreshToken: refresh_token,
			},
		});

		res.json(user);
	} catch (err) {
		res.status(500).json({ status: 500, error: err.stack });
	}
});

async function verifyGoogleToken(token) {
	const ticket = await googleClient.verifyIdToken({
		idToken: token,
		audience: CLIENT_ID,
	});
	const payload = ticket.getPayload();
	return payload;
}

*/







async function userLogin(options) {
	let { username, email, password, discordID, discordAuth, googleAuth } =
		_.merge(
			{
				discordAuth: {
					accessToken: null,
					refreshToken: null,
				},
				googleAuth: {
					accessToken: null,
					refreshToken: null,
				},
				discordID: null,
			},
			options,
		);

	let user = await userModel.findOne({ "info.email": email });
	if (!user) {
		let userID = v4();
		if (!password) password = userID.substring(0, 8);
		let passwordHash = await createPasswordHash(password);
		user = await userModel.create({
			id: userID,
			info: {
				vip: false,
				username: username,
				email: email,
				password: passwordHash,
				discordID: discordID,
				createdAt: new Date(),
			},
			auth: {
				accessToken: v4(),
				discord: discordAuth,
				google: googleAuth,
			},
			balance: 0,
			orders: [],
		});

		let mailOptions = {
			from: "prgstoretest@gmail.com",
			to: user.info.email,
			subject: "PRG - Store Account Created",
			html: `<h1>Account Created</h1>
			<h2>Thanks For Choosing Us</h2>
			<h3>Email: ${user.info.email}<br/>Password: ${password}</h3>`,
		};

		gmailTransporter.sendMail(mailOptions, (err, info) => {
			if (err) return console.log(err);
			console.log(info);
		});
	} else {
		if (discordAuth) user.auth.discord = discordAuth;
		if (googleAuth) user.auth.google = googleAuth;
		user.auth.accessToken = v4();
		await user.save();
	}

	return user;
}

function createPasswordHash(password) {
	return bcrypt.hash(password, saltRounds);
}

module.exports = router;
