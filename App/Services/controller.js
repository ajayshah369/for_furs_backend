const sharp = require('sharp');
const fs = require('fs');

const User = require('../Users/model');
const Service = require('./model');
const catchAsync = require('../utility/catchAsync');
const AppError = require('../utility/appError');
const { googleCloudBucket } = require('../utility/google-cloud-service');

const QueryFeatures = require('../utility/queryFeatures');

exports.getAllServices = catchAsync(async (req, res, next) => {
	const total = await new QueryFeatures(Service.find(), req.query)
		.filter()
		.query.countDocuments();

	const services = await new QueryFeatures(Service.find(), req.query)
		.filter()
		.pagination()
		.sort()
		.limitFields()
		.select().query;

	res.status(200).json({
		status: 'success',
		total,
		results: services.length,
		services,
	});
});

exports.getService = catchAsync(async (req, res, next) => {
	const service = await new QueryFeatures(
		Service.findById(req.params.id),
		req.query
	)
		.limitFields()
		.select().query;

	// const service = await Service.findById(req.params.id).select(
	// 	'+images +description'
	// );

	if (!service) {
		return next(
			new AppError(404, 'No service found with that ID', 'Not Found')
		);
	}

	if (req.userId) {
		User.findById(req.userId, 'recentlyViewedServices').then((user) => {
			if (user.recentlyViewedServices.indexOf(req.params.id) === -1) {
				if (user.recentlyViewedServices.length === 6) {
					user.recentlyViewedServices.shift();
				}
				user.recentlyViewedServices.push(req.params.id);
				user.save();
			}
		});
	}

	res.status(200).json({
		status: 'success',
		service,
	});
});

exports.createService = catchAsync(async (req, res, next) => {
	delete req.body['createdAt'];

	req.body.price = +req.body.price;

	if (typeof req.body.categories === 'string') {
		req.body.categories = JSON.parse(req.body.categories);
	}

	const service = await Service.create(req.body);

	if (req.file) {
		await sharp(req.file.buffer)
			.png({ quality: 100 })
			.toFile(`App/temp/${service.id}.png`);

		const response = await googleCloudBucket.upload(
			`App/temp/${service.id}.png`,
			{
				destination: `for_furs/services/${service.id}.png`,
				gzip: true,
				uri: true,
			}
		);

		const image = `${response[0].storage.apiEndpoint}/${response[0].bucket.name}/${response[0].name}`;
		service.image = image;

		fs.unlink(`App/temp/${service.id}.png`, () => {});

		await service.save({ validateBeforeSave: false });
	}

	res.status(201).json({
		status: 'success',
		service,
	});
});

exports.updateService = catchAsync(async (req, res, next) => {
	const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
	});

	if (!service) {
		return next(
			new AppError(404, 'No service found with that ID', 'Not Found')
		);
	}

	if (req.file) {
		await sharp(req.file.buffer)
			.png({ quality: 100 })
			.toFile(`App/temp/${service.id}.png`);

		const response = await googleCloudBucket.upload(
			`App/temp/${service.id}.png`,
			{
				destination: `for_furs/services/${service.id}.png`,
				gzip: true,
				uri: true,
			}
		);

		const image = `${response[0].storage.apiEndpoint}/${response[0].bucket.name}/${response[0].name}`;
		service.image = image;

		fs.unlink(`App/temp/${service.id}.png`, () => {});

		await service.save({ validateBeforeSave: false });
	}

	res.status(200).json({
		status: 'success',
		service,
	});
});

exports.deleteService = catchAsync(async (req, res, next) => {
	await User.updateMany(
		{},
		{ $pull: { serviceCart: { service: req.params.id } } }
	);
	const service = await Service.findByIdAndDelete(req.params.id);

	if (!service) {
		return next(
			new AppError(404, 'No service found with that ID', 'Not Found')
		);
	}

	await googleCloudBucket.deleteFiles(`for_furs/services/${req.params.id}.png`);

	res.status(204).json({
		status: 'success',
		service,
	});
});
