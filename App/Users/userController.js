const User = require('./model');
// const AppError = require('../utility/appError');
const catchAsync = require('../utility/catchAsync');

exports.getAllAddresses = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id, 'addresses');

	res.status(200).json({
		status: 'success',
		length: user.addresses.length,
		addresses: user.addresses,
	});
});

exports.addAddress = catchAsync(async (req, res, next) => {
	delete req.body['createdAt'];

	const user = await User.findByIdAndUpdate(
		req.user.id,
		{
			$push: { addresses: req.body },
		},
		{ fields: 'addresses', new: true }
	);

	res.status(200).json({
		status: 'success',
		length: user.addresses.length,
		addresses: user.addresses,
	});
});

exports.removeAddress = catchAsync(async (req, res, next) => {
	const user = await User.findByIdAndUpdate(
		req.user.id,
		{
			$pull: { addresses: { _id: req.params.id } },
		},
		{ fields: 'addresses', new: true }
	);

	res.status(200).json({
		status: 'success',
		length: user.addresses.length,
		addresses: user.addresses,
	});
});

exports.updateAddress = catchAsync(async (req, res, next) => {
	delete req.body['createdAt'];
	const body = {};
	for (let key in req.body) {
		body[`addresses.$.${key}`] = req.body[key];
	}

	await User.updateOne(
		{ _id: req.user.id, 'addresses._id': req.params.id },
		{ $set: body }
	);

	const user = await User.findById(req.user.id, 'addresses');

	res.status(200).json({
		status: 'success',
		length: user.addresses.length,
		addresses: user.addresses,
	});
});

exports.getAllPets = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id, 'pets');

	res.status(200).json({
		status: 'success',
		length: user.pets.length,
		pets: user.pets,
	});
});

exports.addPet = catchAsync(async (req, res, next) => {
	delete req.body['createdAt'];

	const user = await User.findByIdAndUpdate(
		req.user.id,
		{
			$push: { pets: req.body },
		},
		{ fields: 'pets', new: true }
	);

	res.status(200).json({
		status: 'success',
		length: user.pets.length,
		pets: user.pets,
	});
});

exports.removePet = catchAsync(async (req, res, next) => {
	const user = await User.findByIdAndUpdate(
		req.user.id,
		{
			$pull: { pets: { _id: req.params.id } },
		},
		{ fields: 'pets', new: true }
	);

	res.status(200).json({
		status: 'success',
		length: user.pets.length,
		pets: user.pets,
	});
});

exports.updatePet = catchAsync(async (req, res, next) => {
	delete req.body['createdAt'];
	const body = {};
	for (let key in req.body) {
		body[`pets.$.${key}`] = req.body[key];
	}

	await User.updateOne(
		{ _id: req.user.id, 'pets._id': req.params.id },
		{ $set: body }
	);

	const user = await User.findById(req.user.id, 'pets');

	res.status(200).json({
		status: 'success',
		length: user.pets.length,
		pets: user.pets,
	});
});

const getCartValues = async (req, res, next) => {
	const user = await User.findById(req.user.id, 'productCart serviceCart')
		.populate('productCart.product', 'price')
		.populate('serviceCart.service', 'price');

	let productCartQuantity = 0;
	let productCartAmount = 0;

	user.productCart.forEach((e) => {
		productCartQuantity += e.quantity;
		productCartAmount += e.quantity * e.product.price;
	});

	let serviceCartQuantity = 0;
	let serviceCartAmount = 0;

	user.serviceCart.forEach((e) => {
		serviceCartQuantity += e.quantity;
		serviceCartAmount += e.quantity * e.service.price;
	});

	return {
		cartQuantity: productCartQuantity + serviceCartQuantity,
		cartAmount: productCartAmount + serviceCartAmount,
	};
};

exports.getCartValue = catchAsync(async (req, res, next) => {
	const cartValues = await getCartValues(req, res, next);

	res.status(200).json({
		status: 'success',
		cartQuantity: cartValues.cartQuantity,
		cartAmount: cartValues.cartAmount,
	});
});

exports.addToProductCart = catchAsync(async (req, res, next) => {
	let user = await User.findById(req.user.id, 'productCart');

	const product = user.productCart.find(
		(item) => item.product.toString() === req.params.id
	);

	if (product) {
		product.quantity += 1;
	} else {
		user.productCart.push({ product: req.params.id, quantity: 1 });
	}

	await user.save();

	const cartValues = await getCartValues(req, res, next);

	res.status(200).json({
		status: 'success',
		cartQuantity: cartValues.cartQuantity,
		cartAmount: cartValues.cartAmount,
	});
});

exports.removeFromProductCart = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id, 'productCart');

	const product = user.productCart.find(
		(item) => item.product._id.toString() === req.params.id
	);

	if (product) {
		if (req.params.all && req.params.all === 'all') {
			user.productCart.splice(user.productCart.indexOf(product), 1);
		} else {
			product.quantity -= 1;
			if (product.quantity === 0) {
				user.productCart.splice(user.productCart.indexOf(product), 1);
			}
		}
	}

	await user.save();

	const cartValues = await getCartValues(req, res, next);

	res.status(200).json({
		status: 'success',
		cartQuantity: cartValues.cartQuantity,
		cartAmount: cartValues.cartAmount,
	});
});

exports.addToServiceCart = catchAsync(async (req, res, next) => {
	let user = await User.findById(req.user.id, 'serviceCart');

	const service = user.serviceCart.find(
		(item) => item.service.toString() === req.params.id
	);

	if (service) {
		service.quantity += 1;
	} else {
		user.serviceCart.push({ service: req.params.id, quantity: 1 });
	}

	await user.save();

	const cartValues = await getCartValues(req, res, next);

	res.status(200).json({
		status: 'success',
		cartQuantity: cartValues.cartQuantity,
		cartAmount: cartValues.cartAmount,
	});
});

exports.removeFromServiceCart = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id, 'serviceCart');

	const service = user.serviceCart.find(
		(item) => item.service._id.toString() === req.params.id
	);

	if (service) {
		if (req.params.all && req.params.all === 'all') {
			user.serviceCart.splice(user.serviceCart.indexOf(service), 1);
		} else {
			service.quantity -= 1;
			if (service.quantity === 0) {
				user.serviceCart.splice(user.serviceCart.indexOf(service), 1);
			}
		}
	}

	await user.save();

	const cartValues = await getCartValues(req, res, next);

	res.status(200).json({
		status: 'success',
		cartQuantity: cartValues.cartQuantity,
		cartAmount: cartValues.cartAmount,
	});
});

exports.getCart = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id, 'productCart serviceCart')
		.populate('productCart.product', 'name price image')
		.populate('serviceCart.service', 'name price image');

	let productCartQuantity = 0;
	let productCartAmount = 0;

	user.productCart.forEach((e) => {
		productCartQuantity += e.quantity;
		productCartAmount += e.quantity * e.product.price;
	});

	let serviceCartQuantity = 0;
	let serviceCartAmount = 0;

	user.serviceCart.forEach((e) => {
		serviceCartQuantity += e.quantity;
		serviceCartAmount += e.quantity * e.service.price;
	});

	res.status(200).json({
		status: 'success',
		cartQuantity: productCartQuantity + serviceCartQuantity,
		cartAmount: productCartAmount + serviceCartAmount,
		productCart: user.productCart,
		serviceCart: user.serviceCart,
	});
});

exports.recentlyViewedProducts = catchAsync(async (req, res, next) => {
	const user = await User.findById(
		req.user.id,
		'recentlyViewedProducts'
	).populate('recentlyViewedProducts', 'name price image rating');

	res.status(200).json({
		status: 'success',
		recentlyViewedProducts: user.recentlyViewedProducts,
	});
});

exports.recentlyViewedServices = catchAsync(async (req, res, next) => {
	const user = await User.findById(
		req.user.id,
		'recentlyViewedServices'
	).populate('recentlyViewedServices', 'name price image rating');

	res.status(200).json({
		status: 'success',
		recentlyViewedServices: user.recentlyViewedServices,
	});
});
