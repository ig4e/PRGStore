const express = require("express");
const router = express.Router();
const { userModel } = require("../models/user");
const { v4 } = require("uuid");
const _ = require("lodash");

router.get("/user", checkAuth, async (req, res) => {
	let { user } = req;
	res.json({
		status: 200,
		id: user.id,
		info: user.info,
		balance: user.balance,
	});
});

router.get("/user/orders", checkAuth, async (req, res) => {
	let { user } = req;
	res.json({ status: 200, id: user.id, orders: user.orders });
});

async function checkAuth(req, res, next) {
	let { authorization } = req.headers;
	let user = await userModel.findOne({
		"auth.accessToken": authorization.replace("Bearer ", ""),
	});
	if (user) {
		req.user = user;
		next();
	} else {
		res.status(403).json({ status: 403, error: "invaild token" });
	}
}

module.exports = router;
