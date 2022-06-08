const express = require("express");
const router = express.Router();
const { productsModel } = require("../models/products");
const Fuse = require("fuse.js");
const { v4 } = require("uuid");
const _ = require("lodash");

router.get("/search", async (req, res) => {
	try {
		let { query = "" } = req.query;
		const allProducts = await productsModel.find({}).lean();
		const fuse = new Fuse(formatProducts(allProducts), {
			includeScore: true,
			keys: ["title", "description"],
		});
		const products = fuse.search(query).map((result) => result.item);
		res.json({ status: 200, products: products.slice(0, 5) });
	} catch (err) {
		res.json({ status: 500, error: "server error" });
	}
});

router.get("/products", async (req, res) => {
	try {
		let { limit, offset } = _.merge({ limit: 0, offset: 0 }, req.query);
		let allProducts = await productsModel
			.find({})
			.select([
				"id",
				"title",
				"imageURL",
				"price",
				"description",
				"isCode",
				"createdAt",
				"stockCount"
			])
			.skip(offset)
			.limit(limit);

		res.json({ status: 200, products: formatProducts(allProducts) });
	} catch (err) {
		console.log(err)
		res.json({ status: 500, error: "Server Error" });
	}
});

function formatProducts(allProducts) {
	return allProducts.map((product) => {
		return {
			id: product.id,
			title: product.title,
			imageURL: product.imageURL,
			price: product.price,
			description: product.description,
			isCode: product.isCode,
			createdAt: product.createdAt,
			stock: product.stockCount,
		};
	});
}

module.exports = router;
