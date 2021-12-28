const express = require('express');

const adminAuthController = require('../../Admins/authController');
const userAuthController = require('../../Users/authController');
const controller = require('./controller');
const multerUpload = require('../../utility/multer');

const router = express.Router();

router
	.route('/')
	.get(controller.getAllProducts)
	.post(
		adminAuthController.protect,
		multerUpload.single('image'),
		controller.createProduct
	);

router
	.route('/:id')
	.get(userAuthController.identifyUser, controller.getProduct)
	.patch(
		adminAuthController.protect,
		multerUpload.single('image'),
		controller.updateProduct
	)
	.delete(adminAuthController.protect, controller.deleteProduct);

module.exports = router;
