const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const fs = require('fs');

const User = require('./model');
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
const authCookie = 'authCookie';
const phoneVerifyCookie = 'phoneVerifyCookie';
const loginViaOtpCookie = 'loginViaOtpCookie';
const loginViaPasswordCookie = 'loginViaPasswordCookie';
const setPasswordCookie = 'setPasswordCookie';

// ? Register OR Login
exports.registerOrLogin = catchAsync(async (req, res, next) => {
	if (!req.body.phone) {
		return new AppError(422, 'Please provide phone number', 'Invalid data');
	}

	const user = await User.findOne(
		{ phone: req.body.phone },
		'phone phoneVerified password'
	);

	req.user = user;

	if (!user) {
		await register(req, res, next);
	} else if (!user.phoneVerified) {
		await register(req, res, next);
	} else {
		await login(req, res, next);
	}
});

// ? Register
const register = async (req, res, next) => {
	let user, otp;
	user = req.user;

	if (!user) {
		user = await User.create({ phone: req.body.phone });
		otp = await user.generatePhoneOtp();
	}
	otp = await user.generatePhoneOtp();
	await user.save({ validateBeforeSave: false });

	sms.sendOtp(user.phone, otp);
	res.cookie(
		phoneVerifyCookie,
		signOtpAndPasswordJWT(user.id),
		otpAndPasswordCookieOptions()
	);

	res.status(201).json({
		status: 'success',
		message: 'verify phone',
	});
};

// ? Validate phone OTP
exports.verifyPhoneOtp = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[phoneVerifyCookie];

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

	const user = await User.findById(
		decoded.id,
		'phoneVerificationToken phoneVerificationTokenExpires'
	);

	const result = await user.validatePhoneOtp(
		req.body.otp,
		user.phoneVerificationToken,
		user.phoneVerificationTokenExpires
	);
	await user.save({ validateBeforeSave: false });

	if (!result) {
		return next(
			new AppError(422, 'Otp is invalid or expired.', 'Invalid data')
		);
	}

	res.cookie(
		phoneVerifyCookie,
		signOtpAndPasswordJWT(user.id, '1'),
		otpAndPasswordCookieOptions(new Date(Date.now() + 1))
	);
	res.cookie(authCookie, signAuthJWT(user.id), authCookieOptions());
	res.cookie(setPasswordCookie, signOtpAndPasswordJWT(user.id));

	res.status(200).json({
		status: 'success',
		message: 'You successfully logged in',
		id: user.id,
	});
});

exports.resendVerifyPhoneOtp = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[phoneVerifyCookie];

	if (!cookie) {
		return next(new AppError(400, 'Session Expired', 'Bad request'));
	}

	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (err) {
		return next(new AppError(400, 'Session Expired', 'Bad request'));
	}

	const user = await User.findById(decoded.id, 'phone');

	if (!user) {
		return next(new AppError(400, 'Try again', 'Bad request'));
	}

	const otp = await user.generatePhoneOtp();
	await user.save({ validateBeforeSave: false });
	sms.sendOtp(user.phone, otp);

	res.cookie(
		phoneVerifyCookie,
		signOtpAndPasswordJWT(user.id),
		otpAndPasswordCookieOptions()
	);

	res.status(200).json({
		status: 'success',
		message: 'Otp resent successfully',
	});
});

// ? Login
const login = async (req, res, next) => {
	if (req.user.password) {
		await loginViaPassaword(req, res, next);
	} else {
		await loginViaOtp(req, res, next);
	}
};

// ? Login via Password
const loginViaPassaword = async (req, res, next) => {
	res.cookie(
		loginViaPasswordCookie,
		signOtpAndPasswordJWT(req.user.id, '30m'),
		otpAndPasswordCookieOptions(new Date(Date.now() + 30 * 60 * 1000))
	);

	res.status(200).json({
		status: 'success',
		message: 'enter password',
	});
};

// ? Verify Password
exports.verifyPassword = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[loginViaPasswordCookie];

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
		return new AppError(
			422,
			'Your session expired\nTry again !',
			'Invalid data'
		);
	}

	const user = await User.findById(decoded.id, 'password');

	if (!user) {
		return next(new AppError(422, 'The user is deleted', 'Invalid data'));
	}

	if (!req.body.password) {
		return next(
			new AppError(422, 'Please provide the password', 'Invalid data')
		);
	}

	const result = await user.verifyPassword(req.body.password, user.password);

	if (!result) {
		return next(new AppError(422, 'Invalid password', 'Invalid data'));
	}

	res.cookie(
		loginViaPasswordCookie,
		signOtpAndPasswordJWT(user.id, '1'),
		otpAndPasswordCookieOptions(new Date(Date.now() + 1))
	);
	res.cookie(authCookie, signAuthJWT(user.id));

	res.status(200).json({
		status: 'success',
		message: 'you successfully logged in',
		id: user.id,
	});
});

// ? Forgot Password Login via Otp
exports.forgotPasswordLoginViaOtp = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[loginViaPasswordCookie];

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

	const user = await User.findById(decoded.id, 'phone');

	if (!user) {
		return next(new AppError(422, 'The user is deleted', 'Invalid data'));
	}

	// res.cookie(
	// 	loginViaPassawordCookie,
	// 	signOtpAndPasswordJWT(user.id, '1'),
	// 	otpAndPasswordCookieOptions(new Date(Date.now() + 1))
	// );
	req.user = user;

	await loginViaOtp(req, res, next);
});

// ? Login via OTP
const loginViaOtp = async (req, res, next) => {
	const otp = await req.user.generateLoginOtp();
	await req.user.save({ validateBeforeSave: false });
	sms.sendOtp(req.user.phone, otp);
	res.cookie(
		loginViaOtpCookie,
		signOtpAndPasswordJWT(req.user.id),
		otpAndPasswordCookieOptions()
	);

	res.status(200).json({
		status: 'success',
		message: 'enter otp',
	});
};

exports.resendLoginOtp = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[loginViaOtpCookie];

	if (!cookie) {
		return next(new AppError(400, 'Session Expired', 'Bad request'));
	}

	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (err) {
		return next(new AppError(400, 'Session Expired', 'Bad request'));
	}

	const user = await User.findById(decoded.id, 'phone');

	if (!user) {
		return next(new AppError(400, 'Try again', 'Bad request'));
	}

	const otp = await user.generateLoginOtp();
	await user.save({ validateBeforeSave: false });
	sms.sendOtp(user.phone, otp);

	res.cookie(
		loginViaOtpCookie,
		signOtpAndPasswordJWT(user.id),
		otpAndPasswordCookieOptions()
	);

	res.status(200).json({
		status: 'success',
		message: 'Otp resent successfully',
	});
});

// ? Verify Login OTP
exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[loginViaOtpCookie];

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

	const user = await User.findById(decoded.id, 'loginToken loginTokenExpires');

	const result = await user.validateLoginOtp(
		req.body.otp,
		user.loginToken,
		user.loginTokenExpires
	);
	await user.save({ validateBeforeSave: false });

	if (!result) {
		return next(new AppError(422, 'OTP is invalid or expired', 'Invalid data'));
	}

	res.cookie(
		loginViaOtpCookie,
		signOtpAndPasswordJWT(user.id, '1'),
		otpAndPasswordCookieOptions(new Date(Date.now() + 1))
	);
	res.cookie(authCookie, signAuthJWT(user.id), authCookieOptions);
	// res.cookie(setPasswordCookie, signOtpAndPasswordJWT(user.id));

	res.status(200).json({
		status: 'success',
		message: 'you successfully logged in.',
		id: user.id,
	});
});

// ? Protect
exports.protect = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[authCookie];

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

	const user = await User.findById(decoded.id, 'passwordChangedAt phone');

	if (!user) {
		return next(new AppError(401, 'The user is deleted', 'Invalid data'));
	}

	if (decoded.iat <= user.passwordChangedAt) {
		res.cookie(
			authCookie,
			signAuthJWT(user.id, '1'),
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

	req.user = user;
	next();
});

// ? Is Logged In
exports.isLoggedIn = catchAsync(async (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'You are Logged in.',
		id: req.user.id,
	});
});

exports.logout = catchAsync(async (req, res, next) => {
	res.cookie(
		authCookie,
		signAuthJWT(req.user.id, '1'),
		authCookieOptions(new Date(Date.now() + 1))
	);

	res.status(200).json({
		status: 'success',
		message: 'you are successfully logged out',
	});
});

exports.setPassword = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[setPasswordCookie];
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

	if (req.user.id !== decoded.id) {
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

	req.user.password = password;
	await req.user.save();
	res.cookie(
		setPasswordCookie,
		signOtpAndPasswordJWT(req.user.id, '1'),
		otpAndPasswordCookieOptions(new Date(Date.now() + 1))
	);

	res.status(200).json({
		status: 'success',
		message: 'You successfully set your password',
	});
});

exports.updateMe = catchAsync(async (req, res, next) => {
	if (req.body.name) {
		req.user.name = req.body.name;
	}

	if (req.file) {
		await sharp(req.file.buffer)
			.resize(256, 256)
			.png({ quality: 90 })
			.toFile(`App/temp/${req.user.id}.png`);

		const response = await googleCloudBucket.upload(
			`App/temp/${req.user.id}.png`,
			{
				destination: `for_furs/users/${req.user.id}.png`,
				gzip: true,
				uri: true,
			}
		);

		const image = `${response[0].storage.apiEndpoint}/${response[0].bucket.name}/${response[0].name}`;

		fs.unlink(`App/temp/${req.user.id}.png`, () => {});

		req.user.image = image;
	}

	await req.user.save();

	res.status(200).json({
		status: 'success',
		user: {
			name: req.user.name,
			image: req.user.image,
		},
	});
});

exports.removeImage = catchAsync(async (req, res, next) => {
	req.user.image = undefined;
	await googleCloudBucket.deleteFiles(`for_furs/users/${req.user.id}.png`);
	await req.user.save();

	res.status(200).json({
		status: 'success',
		message: 'You successfully removed your image',
	});
});

exports.requestPasswordReset = catchAsync(async (req, res, next) => {
	const otp = await req.user.generatePasswordResetOtp();
	await req.user.save();

	sms.sendOtp(req.user.phone, otp);

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

	const user = await User.findById(
		req.user.id,
		'passwordResetToken passwordResetTokenExpires'
	);

	const result = await user.validatePasswordResetOtp(
		otp,
		user.passwordResetToken,
		user.passwordResetTokenExpires
	);
	await user.save();

	if (!result) {
		return next(new AppError(422, 'Invalid OTP', 'Invalid data'));
	}

	res.cookie(setPasswordCookie, signOtpAndPasswordJWT(user.id));

	res.status(200).json({
		status: 'success',
		message: 'You successfully verified the otp',
	});
});

exports.getMe = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id, 'name phone image');

	// 3) Send response
	res.status(200).json({
		status: 'success',
		user,
	});
});

exports.identifyUser = catchAsync(async (req, res, next) => {
	const cookie = req.cookies[authCookie];
	let decoded;
	try {
		decoded = jwt.verify(cookie, process.env.JWT_SECRET);
	} catch (error) {
		next();
	}

	req.userId = decoded.id;

	next();
});
