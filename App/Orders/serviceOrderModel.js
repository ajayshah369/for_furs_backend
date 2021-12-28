const mongoose = require('mongoose');

const addressModel = require('../Users/addressModel');

const schema = new mongoose.Schema({
	createdAt: {
		type: Date,
		required: true,
		default: Date(),
		immutable: true,
		select: false,
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		immutable: true,
	},
	address: {
		type: addressModel.schema,
		required: true,
		immutable: true,
	},
	service: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Service',
		required: true,
		immutable: true,
	},
	name: {
		type: String,
		required: true,
		immutable: true,
	},
	price: {
		type: Number,
		required: true,
		immutable: true,
	},
	quantity: {
		type: Number,
		min: 1,
		required: true,
		immutable: true,
	},
	dateTime: {
		type: Date,
		required: true,
	},
	orderStatus: {
		type: String,
		required: true,
		enum: [
			'preparing',
			'dispatched',
			'on the way',
			'out for delivery',
			'delivered',
			'cancelled',
			'return',
		],
		default: 'preparing',
	},
	reasonForCancellation: {
		type: String,
	},
	returnStatus: {
		type: String,
		enum: [
			'initiated',
			'accepted',
			'rejected',
			'pickup',
			'returned',
			'cancelled',
		],
	},
	reasonForReturn: {
		type: String,
	},
	refundStatus: {
		type: String,
		enum: ['initiated', 'refunded'],
	},
	delieveryDate: {
		type: Date,
		immutable: true,
	},
});

const ServiceOrder = mongoose.model('ServiceOrder', schema);

module.exports = ServiceOrder;
