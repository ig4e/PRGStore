const { Schema, model } = require("mongoose");

const productSchema = Schema({
	id: { type: String, required: true, unique: true },
	title: { type: String, required: true },
	imageURL: { type: String, required: true },
	price: { type: Number, required: true },
	description: { type: String, default: "-" },
	isCode: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
	stockCount: { type: Number, default: 0 },
	stock: [
		{
			id: String,
			email: String,
			password: String,
			code: String,
			createdAt: Date,
		},
	],
});

const productsModel = model("product", productSchema);

module.exports = { productsModel };

/*

*/

let baba = {
	_id: {
		$oid: "62aa4167425deb5ea3d24ef0",
	},
	id: "862b9525-d6q1-6c51-be81-24e294b9d99x",
	title: "prime gaming",
	imageURL:
		"http://localhost:3500/uploads/862b9525-d6q1-6c51-be81-24e294b9d99x",
	price: 1959,
	description: "nanananananna, dawdawdawdawdadwad\ndawdawdawbaba",
	isCode: true,
	createdAt: "2022-06-15T20:29:15.828+00:00",
	stockCount: 0,
	stock: [],
};
/**
 * Paste one or more documents here
 */
