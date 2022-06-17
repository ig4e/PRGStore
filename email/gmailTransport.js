const nodemailer = require("nodemailer");

const gmailTransporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "prgstoretest@gmail.com",
		pass: "nlvltwwyydvwrgue",
	},
});

module.exports = { gmailTransporter };
