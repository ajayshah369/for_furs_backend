const mongoose = require('mongoose');

const schema = new mongoose.Schema({
	service: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Service',
		required: true,
	},
	quantity: {
		type: Number,
		required: true,
		default: 1,
	},
});

const ServiceCartModel = mongoose.model('ServiceCartModel', schema);

module.exports = ServiceCartModel;
