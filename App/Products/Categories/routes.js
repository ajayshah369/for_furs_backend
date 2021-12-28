const express = require('express');

const multerUpload = require('../../utility/multer');
const adminAuthController = require('../../Admins/authController');
const controller = require('./controller');

const router = express.Router();

router
	.route('/')
	.get(controller.getAllCategories)
	.post(
		adminAuthController.protect,
		multerUpload.single('image'),
		controller.createCategory
	);
router
	.route('/:id')
	.get(controller.getCategory)
	.patch(
		adminAuthController.protect,
		multerUpload.single('image'),
		controller.updateCategory
	)
	.delete(adminAuthController.protect, controller.deleteCategory);

module.exports = router;
