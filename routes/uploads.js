const express = require("express");
const router = express.Router();
const axios = require("axios");
const { encode, decode } = {
	decode: (base64) => Buffer.from(base64, "base64").toString("ascii"),
	encode: (ascii) => Buffer.from(ascii).toString("base64"),
};
router.get("/:id", async (req, res) => {
	try {
		try {
			let { id } = req.params;
			const { data } = await axios({
				url: id
					? `https://media.discordapp.net/attachments/${decode(id)}`
					: "https://media.discordapp.net/attachments/986732172692054026/986735954154901554/unknown.png",
				responseType: "arraybuffer",
			});
			res.type("webp");
			res.send(data);
		} catch (err) {
			const { data } = await axios({
				url: "https://media.discordapp.net/attachments/986732172692054026/986735954154901554/unknown.png",
				responseType: "arraybuffer",
			});
			res.type("webp");
			res.send(data);
		}
	} catch (err) {
		res.json({ status: 500, error: "server error" });
	}
});

//console.log(encode("986732172692054026/986732243881967696/unknown.png"));

/* */

module.exports = router;
