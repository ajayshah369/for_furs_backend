const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const validators = require('../utility/validators');
const formatters = require('../utility/formatters');

const generateOtp = () => {
	let otp = Math.floor(Math.random() * 1000000) + '';

	if (otp.length < 6) {
		return generateOtp();
	}

	return otp;
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
		required: true,
		set: (v) => formatters.formatName(v),
		validate: {
			validator: function (v) {
				return validators.validateName(v);
			},
			message: () => 'Name can contain only letters and spaces.',
		},
	},
	role: {
		type: String,
		required: true,
		enum: ['admin', 'super-admin'],
		default: 'admin',
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
	disabled: {
		type: Boolean,
		default: false,
		select: false,
	},
});

schema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 16);
	}

	next();
});

schema.methods.verifyPassword = async function (plainPassword, hashPassword) {
	return await bcrypt.compare(plainPassword, hashPassword);
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

const Admin = mongoose.model('Admin', schema);

module.exports = Admin;
