const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const { CustomClient } = require("./client");
const { config } = require("./options.json");
const client = new CustomClient({
	intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS"],
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	cors({
		origin: [config.dashboard_link],
		credentials: true,
	}),
);
app.use(
	helmet({
		contentSecurityPolice: false,
	}),
);

const authRouter = require("./routes/auth.js");
app.use("/auth", authRouter);

client.on("interactionCreate", async (inter) => {});

client.probot.on("transfered", async (guild, data, err) => {
	if (err) return guild.channel.send({ content: `❌` });
	var { member, price, receiver } = data;
});

mongoose.connect(process.env.database);
app.listen(() => 3000);
