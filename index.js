const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();
const { CustomClient } = require("./client");
const { config, db } = require("./options");
const authRouter = require("./routes/auth.js");
const userRouter = require("./routes/user.js");
const productsRouter = require("./routes/products.js");
const client = new CustomClient({
	intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS"],
});

const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 50,
	standardHeaders: true,
	legacyHeaders: false,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/auth", authRouter);
app.use("/api", apiLimiter);
app.use("/api", productsRouter);
app.use("/api", userRouter(client));

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

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;
	const { commandName } = interaction;
	let command = client.commands.find(
		(command) => command.info.name == commandName,
	);

	if (command) {
		if (command.info.ownerOnly) {
			if (config.owners.includes(interaction.user.id)) {
				return command.run(client, interaction);
			} else {
				return interaction.reply("❌ | You Can't Use This Command");
			}
		} else {
			command.run(client, interaction);
		}
	}
});

mongoose.connect(db.url).then(() => {
	console.log("DB READY!");
});
app.listen(3000, () => console.log("Server Started!"));
