const { Client } = require("discord.js");
const probotClient = require("./probot");
const { config, client } = require("./options");
const setSlash = require("./slash");
const fs = require("fs");

class CustomClient extends Client {
	constructor(clientOptions) {
		super(clientOptions);
		this.commands = [];
		this.ready = false;
		this.tax = probotClient.tax;
		this.probot = probotClient;

		fs.readdirSync("./commands").map((folderName) => {
			fs.readdirSync("./commands/" + folderName).map((fileName) => {
				let filePath = `./commands/${folderName}/${fileName}`;
				let file = require(filePath);
				this.commands.push(file);
			});
		});

		this.on("ready", async () => {
			this.ready = true;
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
	async sendToTransferChannel(messageOptions) {
		let guild = this.guilds.cache.get(config.guildId);
		let channel = guild.channels.cache.get(config.transferChannelId);
		return channel.send(messageOptions);
	}
}

module.exports = { CustomClient };
