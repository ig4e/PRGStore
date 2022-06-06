const mongoose = require("mongoose");

module.exports = mongoose.model("Users", mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  accessToken: {
    type: String,
    default: "null"
  },
  dollars: {
    type: Number,
    default: 0
  },
  accounts: {
    type: Array,
    default: []
  }
}));