const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const validators = require('../utility/validators');
const formatters = require('../utility/formatters');
const addressModel = require('./addressModel');
const petModel = require('./petModel');
const productCartModel = require('./productCartModel');
const serviceCartModel = require('./serviceCartModel');

const generateOtp = () => {
	let otp = Math.floor(Math.random() * 1000000) + '';

	if (otp.length < 6) {
		return generateOtp();
	}

	return '123456';
};

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
		set: (v) => formatters.formatName(v),
		validate: {
			validator: function (v) {
				return validators.validateName(v);
			},
			message: () => 'Name can contain only letters and spaces.',
		},
	},
	email: {
		type: String,
		lowercase: true,
		validate: {
			validator: function (v) {
				return validators.validateEmail(v);
			},
			message: () => 'Invalid Email',
		},
	},
	phone: {
		type: String,
		unique: true,
		required: true,
		validate: {
			validator: function (v) {
				return validators.validatePhone(v);
			},
			message: () => 'Invalid phone',
		},
	},
	emailVerified: {
		type: Boolean,
		default: false,
	},
	phoneVerified: {
		type: Boolean,
		default: false,
	},
	password: {
		type: String,
		select: false,
	},
	passwordChangedAt: {
		type: Date,
		select: false,
	},
	emailVerificationToken: {
		type: String,
		select: false,
	},
	emailVerificationTokenExpires: {
		type: Date,
		select: false,
	},

	phoneVerificationToken: {
		type: String,
		select: false,
	},
	phoneVerificationTokenExpires: {
		type: Date,
		select: false,
	},

	loginToken: {
		type: String,
		select: false,
	},
	loginTokenExpires: {
		type: Date,
		select: false,
	},
	passwordResetToken: {
		type: String,
		select: false,
	},
	passwordResetTokenExpires: {
		type: Date,
		select: false,
	},
	image: {
		type: String,
	},
	addresses: {
		type: [
			{
				type: addressModel.schema,
			},
		],
		select: false,
	},
	pets: {
		type: [{ type: petModel.schema }],
	},
	productCart: {
		type: [
			{
				type: productCartModel.schema,
			},
		],
		select: false,
	},
	serviceCart: {
		type: [
			{
				type: serviceCartModel.schema,
			},
		],
		select: false,
	},

	recentlyViewedProducts: {
		type: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Product',
			},
		],
		select: false,
		max: 6,
	},
	recentlyViewedServices: {
		type: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Service',
			},
		],
		select: false,
		max: 6,
	},
});

schema.index(
	{ email: 1 },
	{
		unique: true,
		partialFilterExpression: {
			email: { $exists: true, $gt: '' },
		},
	}
);

schema.index(
	{ 'cart.product': 1 },
	{
		unique: false,
		partialFilterExpression: {
			'cart.product': { $exists: true, $ne: null },
		},
	}
);

schema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 16);
	}

	next();
});

schema.methods.verifyPassword = async function (plainPassword, hashPassword) {
	return await bcrypt.compare(plainPassword, hashPassword);
};

schema.methods.generateEmailOtp = async function () {
	const otp = generateOtp();

	this.emailVerificationToken = await bcrypt.hash(otp, 10);
	this.emailVerificationTokenExpires = Date.now() + 10 * 60 * 1000;

	return otp;
};

schema.methods.validateEmailOtp = async function (plainOtp, hashOtp, expires) {
	if (Date.now() > expires) {
		this.emailVerificationToken = undefined;
		this.emailVerificationTokenExpires = undefined;
		return false;
	}
	const result = await bcrypt.compare(plainOtp, hashOtp);
	if (result) {
		this.emailVerified = true;
		this.emailVerificationToken = undefined;
		this.emailVerificationTokenExpires = undefined;
	}

	return result;
};

schema.methods.generatePhoneOtp = async function () {
	const otp = generateOtp();

	this.phoneVerificationToken = await bcrypt.hash(otp, 10);
	this.phoneVerificationTokenExpires = Date.now() + 10 * 60 * 1000;

	return otp;
};

schema.methods.validatePhoneOtp = async function (plainOtp, hashOtp, expires) {
	if (Date.now() > expires) {
		this.phoneVerificationToken = undefined;
		this.phoneVerificationTokenExpires = undefined;
		return false;
	}
	const result = await bcrypt.compare(plainOtp, hashOtp);
	if (result) {
		this.phoneVerified = true;
		this.phoneVerificationToken = undefined;
		this.phoneVerificationTokenExpires = undefined;
	}

	return result;
};

schema.methods.generateLoginOtp = async function () {
	const otp = generateOtp();

	this.loginToken = await bcrypt.hash(otp, 10);
	this.loginTokenExpires = Date.now() + 10 * 60 * 1000;

	return otp;
};

schema.methods.validateLoginOtp = async function (plainOtp, hashOtp, expires) {
	if (Date.now() > expires) {
		this.loginToken = undefined;
		this.loginTokenExpires = undefined;
		return false;
	}
	const result = await bcrypt.compare(plainOtp, hashOtp);
	if (result) {
		this.loginToken = undefined;
		this.loginTokenExpires = undefined;
	}

	return result;
};

schema.methods.generatePasswordResetOtp = async function () {
	const otp = generateOtp();

	this.passwordResetToken = await bcrypt.hash(otp, 10);
	this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

	return otp;
};

schema.methods.validatePasswordResetOtp = async function (
	plainOtp,
	hashOtp,
	expires
) {
	if (Date.now() > expires) {
		this.passwordResetToken = undefined;
		this.passwordResetTokenExpires = undefined;
		return false;
	}
	const result = await bcrypt.compare(plainOtp, hashOtp);
	if (result) {
		this.passwordResetToken = undefined;
		this.passwordResetTokenExpires = undefined;
	}

	return result;
};

const User = mongoose.model('User', schema);

module.exports = User;
