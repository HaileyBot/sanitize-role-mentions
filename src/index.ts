const { APIMessage, TextChannel } = require("discord.js");

module.exports = () => {
	// Replace the "send" function for Guild Text Channels
	TextChannel.prototype.send = async function (content, options) {
		// New added code
		if (typeof content === "string")
			content = content.replace(/<@&(\d+)>/g, (match, id) =>
				// if "everyone" mentions are disabled in client options
				this.client.options.disableMentions === "everyone" &&
				// if the bot has the "Mention Everyone" permission in the guild
				this.guild.me.hasPermission(131072) &&
				// if the role is not normally mentionable, or if the role doesn't exist in the guild
				!this.guild.roles.cache.get(id)?.mentionable
					? // replace the mention with the role's name if it's available
					  `\`@${this.guild.roles.cache.get(id)?.name || "unknown-role"}\``
					: // else pass through the original mention
					  match,
			);

		// Original code for the "send" function
		let apiMessage;
		if (content instanceof APIMessage) apiMessage = content.resolveData();
		else {
			apiMessage = APIMessage.create(this, content, options).resolveData();
			if (Array.isArray(apiMessage.data.content)) return Promise.all(apiMessage.split().map(this.send.bind(this)));
		}
		const { data, files } = await apiMessage.resolveFiles();
		return this.client.api.channels[this.id].messages.post({ data, files }).then(d => this.client.actions.MessageCreate.handle(d).message);
	};
};
