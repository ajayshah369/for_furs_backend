const mongoose = require('mongoose');

const validators = require('../utility/validators');
const formatters = require('../utility/formatters');
const spr = require('../utility/spr');

const schema = new mongoose.Schema({
	// createdAt: {
	// 	type: Date,
	// 	required: true,
	// 	default: Date(),
	// 	immutable: true,
	// 	select: false,
	// },
	country: {
		type: String,
		required: true,
		default: 'India',
		enum: ['India'],
	},
	fullName: {
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
	mobileNumber: {
		type: String,
		required: true,
		validate: {
			validator: function (v) {
				return validators.validatePhone(v);
			},
			message: () => 'Invalid phone',
		},
	},
	pinCode: {
		type: String,
		required: true,
		validate: {
			validator: function (v) {
				return validators.validatePincode(v);
			},
			message: () => `Invalid pincode!`,
		},
	},
	fhbca: {
		type: String,
		required: true,
	},
	acssv: {
		type: String,
		required: true,
	},
	landmark: {
		type: String,
		required: true,
	},
	tc: {
		type: String,
		required: true,
	},
	spr: {
		type: String,
		required: true,
		enum: [...spr],
	},
	addressType: {
		type: String,
		default: 'Home',
		required: true,
		enum: ['Home', 'Office'],
	},
});

const Address = mongoose.model('Address', schema);

module.exports = Address;
