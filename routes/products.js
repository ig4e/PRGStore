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
				"stockCount",
			])
			.skip(offset)
			.limit(limit);

		res.json({ status: 200, products: formatProducts(allProducts) });
	} catch (err) {
		console.log(err);
		res.json({ status: 500, error: "Server Error" });
	}
});

router.get("/product", async (req, res) => {
	try {
		let { productID } = req.query;
		if (!productID)
			return res.json({ status: 400, message: "invaild product ID" });
		let product = await productsModel
			.findOne({ id: productID })
			.select([
				"id",
				"title",
				"imageURL",
				"price",
				"description",
				"isCode",
				"createdAt",
				"stockCount",
			]);

		res.json({ status: 200, products: formatProducts(product) });
	} catch (err) {
		console.log(err);
		res.json({ status: 500, error: "Server Error" });
	}
});

function formatProducts(allProducts) {
	if (Array.isArray(allProducts)) {
		return allProducts.map((product) => {
			return {
				id: product.id,
				title: product.title,
				imageURL: "http://localhost:3000/uploads/" + product.imageURL,
				price: product.price,
				description: product.description,
				isCode: product.isCode,
				createdAt: product.createdAt,
				stock: product.stockCount,
			};
		});
	} else {
		return {
			id: allProducts.id,
			title: allProducts.title,
			imageURL: "http://localhost:3000/uploads/" + allProducts.imageURL,
			price: allProducts.price,
			description: allProducts.description,
			isCode: allProducts.isCode,
			createdAt: allProducts.createdAt,
			stock: allProducts.stockCount,
		};
	}
}

module.exports = router;
