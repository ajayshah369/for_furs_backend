const mongoose = require('mongoose');

const schema = new mongoose.Schema({
	product: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Product',
		required: true,
	},
	quantity: {
		type: Number,
		required: true,
		default: 1,
	},
});

const ProductCartModel = mongoose.model('ProductCartModel', schema);

module.exports = ProductCartModel;
