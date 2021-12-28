const catchAsync = require('../utility/catchAsync');
const QueryFeatures = require('../utility/queryFeatures');

const ProductOrder = require('./productOrderModel');
const ServiceOrder = require('./serviceOrderModel');

exports.getAllProductsOrders = catchAsync(async (req, res, next) => {
	const total = await new QueryFeatures(
		ProductOrder.find({ userId: req.user.id }),
		req.query
	)
		.filter()
		.query.countDocuments();

	const orders = await new QueryFeatures(
		ProductOrder.find({ userId: req.user.id }).populate('product', 'image'),
		req.query
	)
		.filter()
		.pagination()
		.sort()
		.limitFields()
		.select().query;

	res.status(200).json({
		status: 'success',
		total,
		results: orders.length,
		orders,
	});
});

exports.getAllServiceOrders = catchAsync(async (req, res, next) => {
	const total = await new QueryFeatures(
		ServiceOrder.find({ userId: req.user.id }),
		req.query
	)
		.filter()
		.query.countDocuments();

	const orders = await new QueryFeatures(
		ServiceOrder.find({ userId: req.user.id }).populate('service', 'image'),
		req.query
	)
		.filter()
		.pagination()
		.sort()
		.limitFields()
		.select().query;

	res.status(200).json({
		status: 'success',
		total,
		results: orders.length,
		orders,
	});
});
