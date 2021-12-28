/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable no-console */
const User = require('./model');
const AppError = require('../utility/appError');
const catchAsync = require('../utility/catchAsync');
const ServiceOrder = require('../Orders/serviceOrderModel');
const ProductOrder = require('../Orders/productOrderModel');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);

exports.stripePaymentSuccessfull = catchAsync(async (req, res, next) => {
	const sig = req.headers['stripe-signature'];

	let event;

	try {
		event = stripe.webhooks.constructEvent(
			req.rawBody,
			sig,
			process.env.NODE_ENV === 'development'
				? process.env.STRIPE_WEBHOOK_SECRET_TEST
				: process.env.STRIPE_WEBHOOK_SECRET
		);
	} catch (err) {
		console.log(`Webhook Error: ${err.message}`);
		return next(
			new AppError(400, `Webhook Error: ${err.message}`, 'Bad request')
		);
	}

	// Handle the event
	switch (event.type) {
		case 'payment_intent.succeeded':
			const userId = req.body.data.object.metadata.userId;
			const products = JSON.parse(req.body.data.object.metadata.products);
			const services = JSON.parse(req.body.data.object.metadata.services);
			const address = JSON.parse(req.body.data.object.metadata.address);
			const cart = req.body.data.object.metadata.cart === 'true';
			const amount = Number(req.body.data.object.metadata.amount);

			delete address._id;

			services.forEach(async (item) => {
				await ServiceOrder.create({
					userId: userId,
					address: address,
					service: item.service,
					name: item.name,
					price: item.price,
					quantity: item.quantity,
					dateTime: item.dateTime,
				});
			});
			products.forEach(async (item) => {
				await ProductOrder.create({
					userId: userId,
					address: address,
					product: item.product,
					name: item.name,
					price: item.price,
					quantity: item.quantity,
				});
			});

			if (cart) {
				await User.findByIdAndUpdate(userId, {
					productCart: [],
					serviceCart: [],
				});
			}
			break;
		case 'payment_intent.payment_failed':
			console.log(req.body.data.object.metadata);
			console.log(event.type);
			break;
		case 'payment_intent.canceled':
			console.log(req.body.data.object.metadata);
			console.log(event.type);
			break;
		default:
			// console.log(`Unhandled event type ${event.type}`);
			return next(
				new AppError(400, `Unhandled event type ${event.type}`, 'Bad request')
			);
	}
	res.status(200).json({ status: 'success', message: 'Payment Successfull' });
});

exports.getPaymentIntent = catchAsync(async (req, res, next) => {
	let amount = 0;

	if (req.body.products.length === 0 && req.body.services.length === 0) {
		return next(new AppError(400, 'Your cart is empty', 'Bad request'));
	}

	req.body.products.forEach((e) => {
		amount += e.price * e.quantity;
		delete e.image;
	});

	req.body.services.forEach((e) => {
		amount += e.price * e.quantity;
		delete e.image;
	});

	const paymentIntent = await stripe.paymentIntents.create({
		amount: amount * 100,
		currency: 'inr',
		automatic_payment_methods: {
			enabled: true,
		},
		metadata: {
			userId: req.user.id,
			products: JSON.stringify(req.body.products),
			services: JSON.stringify(req.body.services),
			address: JSON.stringify(req.body.address),
			cart: JSON.stringify(req.params.cart === 'true'),
			amount: amount.toString(),
		},
	});

	res.status(200).json({
		status: 'success',
		paymentIntent: paymentIntent.client_secret,
	});
});
