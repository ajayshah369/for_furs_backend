const multer = require('multer');

const AppError = require('./appError');

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError(422, 'Please only upload images', 'Invalid data'));
	}
};

const multerUpload = multer({
	storage: multer.memoryStorage(),
	fileFilter: multerFilter,
});

module.exports = multerUpload;
