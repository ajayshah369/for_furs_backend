const mongoose = require('mongoose');

const validators = require('../utility/validators');
const formatters = require('../utility/formatters');

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
		set: (v) => formatters.formatName(v),
		validate: {
			validator: function (v) {
				return validators.validateName(v);
			},
			message: () => 'Name can contain only letters and spaces.',
		},
	},
	age: {
		type: Number,
		min: 0,
		max: 30,
		required: true,
	},
	breed: {
		type: String,
		required: true,
		lowercase: true,
	},
	image: {
		type: String,
		required: true,
		default:
			'https://storage.googleapis.com/for_furs_cloud_storage/for_furs/users/pets/pet.png',
	},
});

const Pet = mongoose.model('Pet', schema);

module.exports = Pet;
