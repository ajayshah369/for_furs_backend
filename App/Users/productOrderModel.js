const mongoose = require('mongoose');

const schema = new mongoose.Schema({
	createdAt: {
		type: Date,
		default: Date.now,
		required: true,
		immutable: true,
		select: false,
	},
	productRef: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Product',
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	totalPrice: {
		type: Number,
		required: true,
	},
	image: {
		type: String,
		required: true,
	},
	quantity: {
		type: Number,
		required: true,
	},
});

const ProductCartModel = mongoose.model('ProductOrderModel', schema);

module.exports = ProductCartModel;
