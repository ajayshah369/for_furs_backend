const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const fs = require('fs');

const Admin = require('./model');
const AppError = require('../utility/appError');
const catchAsync = require('../utility/catchAsync');
const sms = require('../utility/sms');
const { googleCloudBucket } = require('../utility/google-cloud-service');

// ! Sign JWT
const signAuthJWT = (id, exp = process.env.JWT_EXPIRES_IN + 'd') => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: exp,
		issuer: 'For Furs',
	});
};

const signOtpAndPasswordJWT = (id, exp = '10m') => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: exp,
		issuer: 'For Furs',
	});
};

// ! Cookie Options
const authCookieOptions = (
	exp = new Date(Date.now() + +process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000)
) => {
	return {
		expires: exp,
		httpOnly: true,
	};
};

const otpAndPasswordCookieOptions = (
	exp = new Date(Date.now() + 10 * 60 * 1000)
) => {
	return {
		expires: exp,
		httpOnly: true,
	};
};

// ! Cookie names
const adminAuthCookie = 'adminAuthCookie';
const adminPhoneVerifyCookie = 'adminPhoneVerifyCookie';
const adminLoginViaOtpCookie = 'adminLoginViaOtpCookie';
const adminLoginViaPasswordCookie = 'adminLoginViaPasswordCookie';
const adminSetPasswordCookie = 'adminSetPasswordCookie';

// ? Login
exports.login = catchAsync(async (req, res, next) => {
	const admin = await Admin.findOne(
		{ phone: req.body.phone },
		'phone phoneVerified password'
	);

	if (!admin) {
		return next(
			new AppError(422, 'No admin found with this number', 'Invalid data')
		);
	}

	req.admin = admin;

	if (!admin.phoneVerified) {
		await sendverifyPhoneOtp(req, res, next);
	} else if (admin.password) {
		await loginViaPassword(req, res, next);
	} else {
		await loginViaOtp(req, res, next);
	}
});

// ? Verify Phone
const sendverifyPhoneOtp = async (req, res, next) => {
	const otp = await req.admin.generatePhoneOtp();
	await req.admin.save({ validateBeforeSave: false });

	sms.sendOtp(req.admin.phone, otp);
	res.cookie(
		adminPhoneVerifyCookie,
		signOtpAndPasswordJWT(req.admin.id),
		otpAndPasswordCookieOptions()
	);

	res.status(201).json({
		status: 'success',
		message: 'verify phone',
	});
};

// ? Validate phone OTP
exports.verifyPhone = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[adminPhoneVerifyCookie];

	if (!cookie) {
		return next(new AppError(422, 'The otp is expired.', 'Invalid data'));
	}

	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (err) {
		return next(
			new AppError(422, 'The otp is invalid or expired.', 'Invalid data')
		);
	}

	if (!req.body.otp) {
		return next(new AppError(422, 'Please provide the otp', 'Invalid data'));
	}

	const admin = await Admin.findById(
		decoded.id,
		'phoneVerificationToken phoneVerificationTokenExpires'
	);

	const result = await admin.validatePhoneOtp(
		req.body.otp,
		admin.phoneVerificationToken,
		admin.phoneVerificationTokenExpires
	);
	await admin.save({ validateBeforeSave: false });

	if (!result) {
		return next(
			new AppError(422, 'Otp is invalid or expired.', 'Invalid data')
		);
	}

	res.cookie(
		adminPhoneVerifyCookie,
		signOtpAndPasswordJWT(admin.id, '1'),
		otpAndPasswordCookieOptions(new Date(Date.now() + 1))
	);
	res.cookie(adminAuthCookie, signAuthJWT(admin.id), authCookieOptions());

	res.status(200).json({
		status: 'success',
		message: 'You successfully logged in',
	});
});

exports.resendVerifyPhoneOtp = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[adminPhoneVerifyCookie];

	if (!cookie) {
		return next(new AppError(400, 'Session Expired', 'Bad request'));
	}

	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (err) {
		return next(new AppError(400, 'Session Expired', 'Bad request'));
	}

	const admin = await Admin.findById(decoded.id, 'phone');

	if (!admin) {
		return next(new AppError(400, 'Try again', 'Bad request'));
	}

	const otp = await admin.generatePhoneOtp();
	await admin.save({ validateBeforeSave: false });
	sms.sendOtp(admin.phone, otp);

	res.cookie(
		adminPhoneVerifyCookie,
		signOtpAndPasswordJWT(admin.id),
		otpAndPasswordCookieOptions()
	);

	res.status(200).json({
		status: 'success',
		message: 'Otp resent successfully',
	});
});

// ? Login via Password
const loginViaPassword = async (req, res, next) => {
	res.cookie(
		adminLoginViaPasswordCookie,
		signOtpAndPasswordJWT(req.admin.id, '30m'),
		otpAndPasswordCookieOptions(new Date(Date.now() + 30 * 60 * 1000))
	);

	res.status(200).json({
		status: 'success',
		message: 'enter password',
	});
};

// ? Verify Password
exports.verifyPassword = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[adminLoginViaPasswordCookie];

	if (!cookie) {
		return new AppError(
			422,
			'Your session expired\nTry again !',
			'Invalid data'
		);
	}

	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (error) {
		if (!cookie) {
			return new AppError(
				422,
				'Your session expired\nTry again !',
				'Invalid data'
			);
		}
	}

	const admin = await Admin.findById(decoded.id, 'password');

	if (!admin) {
		return next(new AppError(422, 'The admin is deleted', 'Invalid data'));
	}

	if (!req.body.password) {
		return next(
			new AppError(422, 'Please provide the password', 'Invalid data')
		);
	}

	const result = await admin.verifyPassword(req.body.password, admin.password);

	if (!result) {
		return next(new AppError(422, 'Invalid password', 'Invalid data'));
	}

	res.cookie(
		adminLoginViaPasswordCookie,
		signOtpAndPasswordJWT(admin.id, '1'),
		otpAndPasswordCookieOptions(new Date(Date.now() + 1))
	);
	res.cookie(adminAuthCookie, signAuthJWT(admin.id));

	res.status(200).json({
		status: 'success',
		message: 'you successfully logged in',
	});
});

// ? Forgot Password Login via Otp
exports.forgotPasswordLoginViaOtp = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[adminLoginViaPasswordCookie];

	if (!cookie) {
		return new AppError(
			422,
			'Your session expired\nTry again !',
			'Invalid data'
		);
	}

	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (error) {
		if (!cookie) {
			return new AppError(
				422,
				'Your session expired\nTry again !',
				'Invalid data'
			);
		}
	}

	const admin = await Admin.findById(decoded.id, 'phone');

	if (!admin) {
		return next(new AppError(422, 'The admin is deleted', 'Invalid data'));
	}

	// res.cookie(
	// 	adminLoginViaPasswordCookie,
	// 	signOtpAndPasswordJWT(admin.id, '1'),
	// 	otpAndPasswordCookieOptions(new Date(Date.now() + 1))
	// );
	req.admin = admin;

	await loginViaOtp(req, res, next);
});

// ? Login via OTP
const loginViaOtp = async (req, res, next) => {
	const otp = await req.admin.generateLoginOtp();
	await req.admin.save({ validateBeforeSave: false });
	sms.sendOtp(req.admin.phone, otp);
	res.cookie(
		adminLoginViaOtpCookie,
		signOtpAndPasswordJWT(req.admin.id),
		otpAndPasswordCookieOptions()
	);

	res.status(200).json({
		status: 'success',
		message: 'enter otp',
	});
};

exports.resendLoginOtp = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[adminLoginViaOtpCookie];

	if (!cookie) {
		return next(new AppError(400, 'Session Expired', 'Bad request'));
	}

	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (err) {
		return next(new AppError(400, 'Session Expired', 'Bad request'));
	}

	const admin = await Admin.findById(decoded.id, 'phone');

	if (!admin) {
		return next(new AppError(400, 'Try again', 'Bad request'));
	}

	const otp = await admin.generateLoginOtp();
	await admin.save({ validateBeforeSave: false });
	sms.sendOtp(admin.phone, otp);

	res.cookie(
		adminLoginViaOtpCookie,
		signOtpAndPasswordJWT(admin.id),
		otpAndPasswordCookieOptions()
	);

	res.status(200).json({
		status: 'success',
		message: 'Otp resent successfully',
	});
});

// ? Verify Login OTP
exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[adminLoginViaOtpCookie];

	if (!cookie) {
		return next(new AppError(422, 'Otp is expired.', 'Invalid data'));
	}

	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (err) {
		return next(
			new AppError(422, 'The otp is invalid or expired.', 'Invalid data')
		);
	}

	if (!req.body.otp) {
		return next(new AppError(422, 'Please provide the otp', 'Invalid data'));
	}

	const admin = await Admin.findById(
		decoded.id,
		'loginToken loginTokenExpires'
	);

	const result = await admin.validateLoginOtp(
		req.body.otp,
		admin.loginToken,
		admin.loginTokenExpires
	);
	await admin.save({ validateBeforeSave: false });

	if (!result) {
		return next(new AppError(422, 'OTP is invalid or expired', 'Invalid data'));
	}

	res.cookie(
		adminLoginViaOtpCookie,
		signOtpAndPasswordJWT(admin.id, '1'),
		otpAndPasswordCookieOptions(new Date(Date.now() + 1))
	);
	res.cookie(adminAuthCookie, signAuthJWT(admin.id), authCookieOptions);

	res.status(200).json({
		status: 'success',
		message: 'you successfully logged in.',
	});
});

// ? Protect
exports.protect = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[adminAuthCookie];

	if (!cookie) {
		return next(
			new AppError(
				401,
				'You are not logged in\nMay be you session expired\ntry login in again',
				'Unauthorized'
			)
		);
	}

	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (error) {
		return next(
			new AppError(
				401,
				'You are not logged in\nMay be you session expired\ntry login in again',
				'Unauthorized'
			)
		);
	}

	const admin = await Admin.findById(
		decoded.id,
		'passwordChangedAt, role, phone'
	);

	if (!admin) {
		return next(new AppError(422, 'The admin is deleted', 'Invalid data'));
	}

	if (decoded.iat <= admin.passwordChangedAt) {
		res.cookie(
			adminAuthCookie,
			signAuthJWT(admin.id, '1'),
			authCookieOptions(new Date(Date.now() + 1))
		);

		return next(
			new AppError(
				401,
				'You recently changed your password\n try login in again',
				'Unauthorized'
			)
		);
	}

	req.admin = admin;
	next();
});

// ? Is Logged In
exports.isLoggedIn = catchAsync(async (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'You are Logged in.',
	});
});

exports.logout = catchAsync(async (req, res, next) => {
	res.cookie(
		adminAuthCookie,
		signAuthJWT(req.admin.id, '1'),
		authCookieOptions(new Date(Date.now() + 1))
	);

	res.status(200).json({
		status: 'success',
		message: 'you are successfully logged out',
	});
});

exports.setPassword = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[adminSetPasswordCookie];
	const { password } = { ...req.body };

	if (!cookie) {
		return next(new AppError(400, 'Session Expired', 'Bad request'));
	}

	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (err) {
		return next(new AppError(400, 'Session Expired', 'Bad request'));
	}

	if (req.admin.id !== decoded.id) {
		return next(new AppError(400, 'Try again', 'Bad request'));
	}

	if (!password) {
		return next(
			new AppError(422, 'Please provide the password', 'Invalid data')
		);
	}

	if (password.length < 6) {
		return next(
			new AppError(422, 'Password must be of minimum length 6', 'Invalid data')
		);
	}

	req.admin.password = password;
	await req.admin.save();
	res.cookie(
		adminSetPasswordCookie,
		signOtpAndPasswordJWT(req.admin.id, '1'),
		otpAndPasswordCookieOptions(new Date(Date.now() + 1))
	);

	res.status(200).json({
		status: 'success',
		message: 'You successfully set your password',
	});
});

exports.uploadImage = catchAsync(async (req, res, next) => {
	if (!req.file) {
		return next(new AppError(422, 'Please upload a image', 'Invalid data'));
	}

	await sharp(req.file.buffer)
		.resize(256, 256)
		.png({ quality: 90 })
		.toFile(`App/temp/${req.admin.id}.png`);

	const response = await googleCloudBucket.upload(
		`App/temp/${req.admin.id}.png`,
		{
			destination: `for_furs/admins/${req.admin.id}.png`,
			gzip: true,
			uri: true,
		}
	);

	const image = `${response[0].storage.apiEndpoint}/${response[0].bucket.name}/${response[0].name}`;

	fs.unlink(`App/temp/${req.admin.id}.png`, () => {});

	req.admin.image = image;
	await req.admin.save({ validateBeforeSave: false });

	res.status(200).json({
		status: 'success',
	});
});

exports.restrictedTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.admin.role)) {
			return next(
				new AppError(
					403,
					'You do not have permission to perform this action',
					'Unauthorized'
				)
			);
		}

		next();
	};
};

exports.getMe = catchAsync(async (req, res, next) => {
	const admin = await Admin.findById(req.admin.id, 'name phone image');

	// 3) Send response
	res.status(200).json({
		status: 'success',
		admin,
	});
});

exports.removeImage = catchAsync(async (req, res, next) => {
	req.admin.image = undefined;
	await googleCloudBucket.deleteFiles(`for_furs/admins/${req.admin.id}.png`);
	await req.admin.save();

	res.status(200).json({
		status: 'success',
		message: 'You successfully removed your image',
	});
});

exports.requestPasswordReset = catchAsync(async (req, res, next) => {
	const otp = await req.admin.generatePasswordResetOtp();
	await req.admin.save();

	sms.sendOtp(req.admin.phone, otp);

	res.status(200).json({
		status: 'success',
		message: 'A otp is sent to your mobile number',
	});
});

exports.verifyPasswordResetOtp = catchAsync(async (req, res, next) => {
	const { otp } = { ...req.body };

	if (!otp) {
		return next(new AppError(422, 'Please provide the otp', 'Invalid data'));
	}

	const admin = await Admin.findById(
		req.admin.id,
		'passwordResetToken passwordResetTokenExpires'
	);

	const result = await admin.validatePasswordResetOtp(
		otp,
		admin.passwordResetToken,
		admin.passwordResetTokenExpires
	);
	await admin.save();

	if (!result) {
		return next(new AppError(422, 'Invalid OTP', 'Invalid data'));
	}

	res.cookie(adminSetPasswordCookie, signOtpAndPasswordJWT(admin.id));

	res.status(200).json({
		status: 'success',
		message: 'You successfully verified the otp',
	});
});
