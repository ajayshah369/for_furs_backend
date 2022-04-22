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
	description: {
		type: String,
		required: true,
	},
	image: {
		type: String,
		required: true,
		default:
			'https://storage.googleapis.com/for_furs/for_furs/products/categories/category.png',
	},
	best: {
		type: Boolean,
		required: true,
		default: false,
		select: false,
	},
	keywords: {
		type: [String],
		select: false,
	},
});

const Category = mongoose.model('Category', schema);

module.exports = Category;
