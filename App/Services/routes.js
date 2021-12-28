const express = require('express');

const adminAuthController = require('../Admins/authController');
const userAuthController = require('../Users/authController');
const controller = require('./controller');
const multerUpload = require('../utility/multer');

const router = express.Router();

router
	.route('/')
	.get(controller.getAllServices)
	.post(
		adminAuthController.protect,
		multerUpload.single('image'),
		controller.createService
	);

router
	.route('/:id')
	.get(userAuthController.identifyUser, controller.getService)
	.patch(
		adminAuthController.protect,
		multerUpload.single('image'),
		controller.updateService
	)
	.delete(adminAuthController.protect, controller.deleteService);

module.exports = router;
