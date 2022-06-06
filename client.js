const { Client } = require("discord.js");
const { Probot } = require("discord-probot-transfer");
const { config } = require("./options.json");
const setSlash = require("./slash");

class CustomClient extends Client {
	constructor(clientOptions) {
		super(clientOptions);
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
			await setSlash(this, config.guildId);
		});

		this.login(process.env.token);
	}
}

module.exports = { CustomClient };
