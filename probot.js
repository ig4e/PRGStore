async function waitForTransfer(
	message,
	{ receiverIDs, transferorID, withTax, amount, time },
) {
	let info = {
		receiver: null,
		transferor: null,
		transferredAmount: null,
		receviedAmount: null,
		hasTransferredTheFullPrice: false,
	};

	let filter = async (message) => {
		let { content, author, channel, mentions, reference } = message;

		if (
			content.startsWith("**:moneybag:") &&
			author.id == "282859044593598464"
		) {
			info.receiver = mentions.members.first();
			let messageId = reference?.messageId;
			if (messageId) {
				let refrencedMessage = await channel.messages.fetch(messageId);
				info.transferor = refrencedMessage?.author;
				if (!info.transferor || info.transferor.id !== transferorID)
					return false;
			}
			if (!receiverIDs.includes(info.receiver?.id)) return false;

			info.receviedAmount = Number(content.split("$")[1].split("`")[0]);
			info.transferredAmount = tax(info.receviedAmount);

			if (withTax) {
				if (Math.abs(amount - info.receviedAmount) < 100) {
					info.hasTransferredTheFullPrice = true;
				} else {
					info.hasTransferredTheFullPrice = false;
				}
			} else {
				if (Math.abs(amount - info.transferredAmount) < 100) {
					info.hasTransferredTheFullPrice = true;
				} else {
					info.hasTransferredTheFullPrice = false;
				}
			}
			return true;
		}
		return false;
	};

	let collecter = await message.channel.awaitMessages({
		filter,
		max: 1,
		time: time ?? 5 * 60 * 1000,
		errors: ["time"],
	});

	return info;
}

function tax(amount) {
	return Math.ceil(amount / 0.95);
}

module.exports = { waitForTransfer, tax };
