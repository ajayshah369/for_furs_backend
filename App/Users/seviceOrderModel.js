const mongoose = require('mongoose');

const schema = new mongoose.Schema({
	createdAt: {
		type: Date,
		default: Date.now,
		required: true,
		immutable: true,
		select: false,
	},
	serviceRef: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Service',
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
	// dateBetween: {
	// 	type: [Date],
	// 	required: true,
	// 	validate: {
	// 		validator: function (v) {
	// 			return v.length === 2 && v[0] < v[1];
	// 		},
	// 		message: () => 'Invalid Date Range',
	// 	},
	// },
});

const ProductCartModel = mongoose.model('ServiceOrderModel', schema);

module.exports = ProductCartModel;
