const sharp = require('sharp');
const fs = require('fs');

const User = require('../../Users/model');
const Product = require('./model');
const catchAsync = require('../../utility/catchAsync');
const AppError = require('../../utility/appError');
const { googleCloudBucket } = require('../../utility/google-cloud-service');

const QueryFeatures = require('../../utility/queryFeatures');

exports.getAllProducts = catchAsync(async (req, res, next) => {
	const total = await new QueryFeatures(Product.find(), req.query)
		.filter()
		.query.countDocuments();

	const products = await new QueryFeatures(Product.find(), req.query)
		.filter()
		.pagination()
		.sort()
		.limitFields()
		.select().query;

	res.status(200).json({
		status: 'success',
		total,
		results: products.length,
		products,
	});
});

exports.getProduct = catchAsync(async (req, res, next) => {
	const product = await new QueryFeatures(
		Product.findById(req.params.id),
		req.query
	)
		.limitFields()
		.select().query;

	if (!product) {
		return next(
			new AppError(404, 'No product found with that ID', 'Not Found')
		);
	}

	if (req.userId) {
		User.findById(req.userId, 'recentlyViewedProducts').then((user) => {
			if (user.recentlyViewedProducts.indexOf(req.params.id) === -1) {
				if (user.recentlyViewedProducts.length === 6) {
					user.recentlyViewedProducts.shift();
				}
				user.recentlyViewedProducts.push(req.params.id);
				user.save();
			}
		});
	}

	res.status(200).json({
		status: 'success',
		product,
	});
});

exports.createProduct = catchAsync(async (req, res, next) => {
	delete req.body['createdAt'];

	req.body.price = +req.body.price;

	if (typeof req.body.categories === 'string') {
		req.body.categories = JSON.parse(req.body.categories);
	}

	const product = await Product.create(req.body);

	if (req.file) {
		await sharp(req.file.buffer)
			.png({ quality: 100 })
			.toFile(`App/temp/${product.id}.png`);

		const response = await googleCloudBucket.upload(
			`App/temp/${product.id}.png`,
			{
				destination: `for_furs/products/products/${product.id}.png`,
				gzip: true,
				uri: true,
			}
		);

		const image = `${response[0].storage.apiEndpoint}/${response[0].bucket.name}/${response[0].name}`;
		product.image = image;

		fs.unlink(`App/temp/${product.id}.png`, () => {});

		await product.save({ validateBeforeSave: false });
	}

	res.status(201).json({
		status: 'success',
		product,
	});
});

exports.updateProduct = catchAsync(async (req, res, next) => {
	const product = await Product.findByIdAndUpdate(req.params.id, req.body);

	if (!product) {
		return next(
			new AppError(404, 'No product found with that ID', 'Not Found')
		);
	}

	if (req.file) {
		await sharp(req.file.buffer)
			.png({ quality: 100 })
			.toFile(`App/temp/${product.id}.png`);

		const response = await googleCloudBucket.upload(
			`App/temp/${product.id}.png`,
			{
				destination: `for_furs/products/products/${product.id}.png`,
				gzip: true,
				uri: true,
			}
		);

		const image = `${response[0].storage.apiEndpoint}/${response[0].bucket.name}/${response[0].name}`;
		product.image = image;

		fs.unlink(`App/temp/${product.id}.png`, () => {});

		await product.save({ validateBeforeSave: false });
	}

	res.status(200).json({
		status: 'success',
		product,
	});
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
	await User.updateMany(
		{},
		{ $pull: { productCart: { product: req.params.id } } }
	);
	const product = await Product.findByIdAndDelete(req.params.id);

	if (!product) {
		return next(
			new AppError(404, 'No product found with that ID', 'Not Found')
		);
	}

	await googleCloudBucket.deleteFiles(
		`for_furs/products/products/${req.params.id}.png`
	);

	res.status(204).json({
		status: 'success',
		product,
	});
});
