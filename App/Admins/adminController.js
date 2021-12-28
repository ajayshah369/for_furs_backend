const Admin = require('./model');
const AppError = require('../utility/appError');
const catchAsync = require('../utility/catchAsync');
const { googleCloudBucket } = require('../utility/google-cloud-service');

// ? Create Admin
exports.createAdmin = catchAsync(async (req, res, next) => {
	const admin = await Admin.create(req.body);

	res.status(201).json({
		status: 'success',
		admin,
	});
});

exports.disableEnableAdmin = catchAsync(async (req, res, next) => {
	const admin = await Admin.findById(req.params.id, 'disabled');

	if (!admin) {
		return next(
			new AppError(422, 'No admin found with that id', 'Inavlid data')
		);
	}

	admin.disabled = !admin.disabled;
	await admin.save({ validateBeforeSave: false });

	res.status(200).json({
		status: 'success',
	});
});

exports.deleteAdmin = catchAsync(async (req, res, next) => {
	const admin = await Admin.findByIdAndDelete(req.params.id);

	if (!admin) {
		return next(
			new AppError(422, 'No admin found with that id', 'Inavlid data')
		);
	}

	await googleCloudBucket.deleteFiles(`for_furs/admins/${req.params.id}.png`);

	res.status(204).json({
		status: 'success',
	});
});
