const express = require('express');

const multerUpload = require('../../utility/multer');
const adminAuthController = require('../../Admins/authController');
const controller = require('./controller');

const router = express.Router();

router
	.route('/')
	.get(controller.getAllBrands)
	.post(
		adminAuthController.protect,
		multerUpload.single('image'),
		controller.createBrand
	);
router
	.route('/:id')
	.get(controller.getBrand)
	.patch(
		adminAuthController.protect,
		multerUpload.single('image'),
		controller.updateBrand
	)
	.delete(adminAuthController.protect, controller.deleteBrand);

module.exports = router;
