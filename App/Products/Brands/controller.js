const sharp = require('sharp');
const fs = require('fs');

const Brand = require('./model');
const Product = require('../Products/model');
const User = require('../../Users/model');
const catchAsync = require('../../utility/catchAsync');
const AppError = require('../../utility/appError');
const { googleCloudBucket } = require('../../utility/google-cloud-service');

const QueryFeatures = require('../../utility/queryFeatures');

exports.getAllBrands = catchAsync(async (req, res, next) => {
	const total = await Brand.countDocuments();

	const brands = await new QueryFeatures(Brand.find(), req.query)
		.filter()
		.pagination()
		.sort()
		.limitFields()
		.select().query;

	res.status(200).json({
		status: 'success',
		total,
		results: brands.length,
		brands,
	});
});

exports.getBrand = catchAsync(async (req, res, next) => {
	const brand = await new QueryFeatures(
		Brand.findById(req.params.id),
		req.query
	)
		.limitFields()
		.select().query;

	if (!brand) {
		return next(new AppError(404, 'No brand found with that ID', 'Not Found'));
	}

	res.status(200).json({
		status: 'success',
		brand,
	});
});

exports.createBrand = catchAsync(async (req, res, next) => {
	delete req.body['createdAt'];

	const newBrand = await Brand.create(req.body);

	if (req.file) {
		await sharp(req.file.buffer)
			.png({ quality: 100 })
			.toFile(`App/temp/${newBrand.id}.png`);

		const response = await googleCloudBucket.upload(
			`App/temp/${newBrand.id}.png`,
			{
				destination: `for_fours/products/brands/${newBrand.id}.png`,
				gzip: true,
				uri: true,
			}
		);

		const image = `${response[0].storage.apiEndpoint}/${response[0].bucket.name}/${response[0].name}`;
		newBrand.image = image;

		fs.unlink(`App/temp/${newBrand.id}.png`, () => {});

		await newBrand.save({ validateBeforeSave: false });
	}

	res.status(201).json({
		status: 'success',
		brand: newBrand,
	});
});

exports.updateBrand = catchAsync(async (req, res, next) => {
	delete req.body['createdAt'];

	const brand = await Brand.findByIdAndUpdate(req.params.id, req.body);

	if (!brand) {
		return next(new AppError(404, 'No brand found with that ID', 'Not Found'));
	}

	if (req.file) {
		await sharp(req.file.buffer)
			.png({ quality: 100 })
			.toFile(`App/temp/${brand.id}.png`);

		const response = await googleCloudBucket.upload(
			`App/temp/${brand.id}.png`,
			{
				destination: `for_furs/products/brands/${brand.id}.png`,
				gzip: true,
				uri: true,
			}
		);

		const image = `${response[0].storage.apiEndpoint}/${response[0].bucket.name}/${response[0].name}`;
		brand.image = image;

		fs.unlink(`App/temp/${brand.id}.png`, () => {});

		await brand.save({ validateBeforeSave: false });
	}

	res.status(200).json({
		status: 'success',
		brand,
	});
});

exports.deleteBrand = catchAsync(async (req, res, next) => {
	const brand = await Brand.findById(req.params.id, '');

	if (!brand) {
		return next(new AppError(404, 'No brand found with that ID', 'Not Found'));
	}

	const products = await Product.find({ brand: brand.id }, '_id');
	products.forEach(async (product) => {
		await User.findByIdAndUpdate({
			$pull: { productCart: { product: product._id } },
		});
		await Product.findByIdAndDelete(product._id);
	});
	await Brand.findByIdAndDelete(req.params.id);
	await googleCloudBucket.deleteFiles(
		`for_furs/products/brands/${req.params.id}.png`
	);

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
