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
			'https://storage.googleapis.com/for_furs_cloud_storage/for_furs/products/products/product.png',
	},
	images: {
		type: [String],
		default: [
			'https://storage.googleapis.com/for_furs_cloud_storage/for_furs/products/products/images.jpg',
			'https://storage.googleapis.com/for_furs_cloud_storage/for_furs/products/products/images.jpg',
			'https://storage.googleapis.com/for_furs_cloud_storage/for_furs/products/products/images.jpg',
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
	best: {
		type: Boolean,
		required: true,
		default: false,
		select: false,
	},
});

const Service = mongoose.model('Service', schema);

module.exports = Service;
