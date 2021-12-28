const sharp = require('sharp');
const fs = require('fs');

const Brand = require('../Brands/model');
const Category = require('./model');
const Product = require('../Products/model');
const catchAsync = require('../../utility/catchAsync');
const AppError = require('../../utility/appError');
const { googleCloudBucket } = require('../../utility/google-cloud-service');

const QueryFeatures = require('../../utility/queryFeatures');

exports.getAllCategories = catchAsync(async (req, res, next) => {
	const total = await Category.countDocuments();
	const categories = await new QueryFeatures(Category.find(), req.query)
		.filter()
		.pagination()
		.sort()
		.limitFields()
		.select().query;

	res.status(200).json({
		status: 'success',
		total,
		results: categories.length,
		categories,
	});
});

exports.getCategory = catchAsync(async (req, res, next) => {
	const category = await new QueryFeatures(
		Category.findById(req.params.id),
		req.query
	)
		.limitFields()
		.select().query;

	if (!category) {
		return next(
			new AppError(404, 'No category found with that ID', 'Not Found')
		);
	}

	res.status(200).json({
		status: 'success',
		category,
	});
});

exports.createCategory = catchAsync(async (req, res, next) => {
	delete req.body['createdAt'];

	const newCategory = await Category.create(req.body);

	if (req.file) {
		await sharp(req.file.buffer)
			.png({ quality: 100 })
			.toFile(`App/temp/${newCategory.id}.png`);

		const response = await googleCloudBucket.upload(
			`App/temp/${newCategory.id}.png`,
			{
				destination: `for_furs/products/categories/${newCategory.id}.png`,
				gzip: true,
				uri: true,
			}
		);

		const image = `${response[0].storage.apiEndpoint}/${response[0].bucket.name}/${response[0].name}`;
		newCategory.image = image;

		fs.unlink(`App/temp/${newCategory.id}.png`, () => {});

		await newCategory.save({ validateBeforeSave: false });
	}

	res.status(201).json({
		status: 'success',
		category: newCategory,
	});
});

exports.updateCategory = catchAsync(async (req, res, next) => {
	delete req.body['createdAt'];

	const category = await Category.findByIdAndUpdate(req.params.id, req.body);

	if (!category) {
		return next(
			new AppError(404, 'No category found with that ID', 'Not Found')
		);
	}

	if (req.file) {
		await sharp(req.file.buffer)
			.png({ quality: 100 })
			.toFile(`App/temp/${category.id}.png`);

		const response = await googleCloudBucket.upload(
			`App/temp/${category.id}.png`,
			{
				destination: `for_furs/products/categories/${category.id}.png`,
				gzip: true,
				uri: true,
			}
		);

		const image = `${response[0].storage.apiEndpoint}/${response[0].bucket.name}/${response[0].name}`;
		category.image = image;

		fs.unlink(`App/temp/${category.id}.png`, () => {});

		await category.save({ validateBeforeSave: false });
	}

	res.status(200).json({
		status: 'success',
		category,
	});
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
	const category = await Category.findById(req.params.id, '');

	if (!category) {
		return next(
			new AppError(404, 'No category found with that ID', 'Not Found')
		);
	}

	await Product.updateMany({}, { $pull: { categories: req.params.id } });
	await Brand.updateMany({}, { $pull: { categories: req.params.id } });
	await Category.findByIdAndDelete(req.params.id);
	await googleCloudBucket.deleteFiles(
		`for_furs/products/categories/${req.params.id}.png`
	);

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
