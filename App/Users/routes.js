const express = require('express');

const authController = require('./authController');
const userController = require('./userController');
const orderController = require('./orderController');
const multerUpload = require('../utility/multer');
const ordersController = require('../Orders/controller');

const router = express.Router();

router.post(
	'/stripePaymentSuccessfull',
	orderController.stripePaymentSuccessfull
);

router.post('/registerOrLogin', authController.registerOrLogin);
router.get('/resendPhoneOtp', authController.resendVerifyPhoneOtp);
router.post('/verifyPhone', authController.verifyPhoneOtp);
router.post('/verifyPassword', authController.verifyPassword);
router.get(
	'/forgotPasswordLoginViaOtp',
	authController.forgotPasswordLoginViaOtp
);
router.post('/verifyLoginOtp', authController.verifyLoginOtp);
router.get('/resendLoginOtp', authController.resendLoginOtp);

router.use(authController.protect);

router.post('/getPaymentIntent/:cart?', orderController.getPaymentIntent);

router.get('/isLoggedIn', authController.isLoggedIn);
router.get('/logout', authController.logout);
router.post('/setPassword', authController.setPassword);
router.get('/requestPasswordReset', authController.requestPasswordReset);
router.post('/verifyPasswordResetOtp', authController.verifyPasswordResetOtp);

router.patch(
	'/updateMe',
	multerUpload.single('image'),
	authController.updateMe
);
router.patch('/removeImage', authController.removeImage);
router.get('/getMe', authController.getMe);

router
	.route('/address')
	.get(userController.getAllAddresses)
	.patch(userController.addAddress);
router
	.route('/address/:id')
	.patch(userController.updateAddress)
	.delete(userController.removeAddress);

router
	.route('/pets')
	.get(userController.getAllPets)
	.patch(userController.addPet);
router
	.route('/pets/:id')
	.patch(userController.updatePet)
	.delete(userController.removePet);

router.get('/cart', userController.getCart);
router.get('/cartValue', userController.getCartValue);

router
	.route('/productCart/:id/:all?')
	.get(userController.addToProductCart)
	.delete(userController.removeFromProductCart);

router
	.route('/serviceCart/:id/:all?')
	.get(userController.addToServiceCart)
	.delete(userController.removeFromServiceCart);

router.get(
	'/recentlyViewedProducts',
	authController.protect,
	userController.recentlyViewedProducts
);

router.get(
	'/recentlyViewedServices',
	authController.protect,
	userController.recentlyViewedServices
);

router.get('/productOrders', ordersController.getAllProductsOrders);
router.get('/serviceOrders', ordersController.getAllServiceOrders);

module.exports = router;
