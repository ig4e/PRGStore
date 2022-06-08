const { Schema, model } = require("mongoose");

const productSchema = Schema({
	id: { type: String, required: true, unique: true },
	title: { type: String, required: true },
	imageURL: { type: String, required: true },
	price: { type: Number, required: true },
	description: { type: String, default: "-" },
	isCode: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
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

productSchema.virtual("stockCount").get(function () {
	return this.stock.length;
});

const productsModel = model("product", productSchema);

module.exports = { productsModel };
