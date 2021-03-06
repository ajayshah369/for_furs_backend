const mongoose = require('mongoose');

const schema = new mongoose.Schema({
	createdAt: {
		type: Date,
		required: true,
		default: Date(),
		immutable: true,
		select: false,
	},
	name: {
		type: String,
		required: true,
		unique: true,
	},
	price: {
		type: Number,
		required: true,
	},
	description: {
		type: String,
		required: true,
		select: false,
	},
	details: {
		type: String,
		required: true,
		select: false,
	},
	image: {
		type: String,
		required: true,
		default:
			'https://storage.googleapis.com/for_furs/for_furs/products/products/product.png',
	},
	images: {
		type: [String],
		default: [
			'https://storage.googleapis.com/for_furs/for_furs/products/products/images.jpg',
			'https://storage.googleapis.com/for_furs/for_furs/products/products/images.jpg',
			'https://storage.googleapis.com/for_furs/for_furs/products/products/images.jpg',
		],
		select: false,
	},
	brand: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Brand',
		required: true,
		select: false,
	},
	categories: {
		type: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Category',
			},
		],
		select: false,
	},
	keywords: {
		type: [{ type: String }],
		select: false,
	},
	rating: {
		type: Number,
		max: 5,
		min: 0,
	},
});

const Product = mongoose.model('Product', schema);

module.exports = Product;
