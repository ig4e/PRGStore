const { Client } = require("discord.js");
const { Probot } = require("discord-probot-transfer");
const { config, client } = require("./options.json");
const setSlash = require("./slash");
const fs = require("fs");

class CustomClient extends Client {
	constructor(clientOptions) {
		super(clientOptions);
		this.commands = [];

		this.probot = Probot(client, {
			fetchGuilds: true,
			data: [
				{
					fetchMembers: true,
					guildId: config.guildId,
					probotId: config.probotId,
					owners: [config.ownerId],
				},
			],
		});

		fs.readdirSync("./commands").map((folderName) => {
			fs.readdirSync("./commands/" + folderName).map((fileName) => {
				let filePath = `./commands/${folderName}/${fileName}`;
				let file = require(filePath);
				this.commands.push(file);
			});
		});

		this.on("ready", async () => {
			this.user.setPresence({
				activities: [
					{
						name: "PRG-Store & DashBord Go to Buy now | https://prg-buyacc.store",
					},
				],
				status: "dnd",
			});
			console.log("Ready :" + this.user.tag);
			await setSlash(this, config.guildId, this.token);
		});

		this.login(client.token);
	}
}

module.exports = { CustomClient };
