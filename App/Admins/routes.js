const express = require('express');

const authController = require('./authController');
const adminController = require('./adminController');
const multerUpload = require('../utility/multer');

const router = express.Router();

// router.post('/verifyPhone', authController.verifyPhone);
router.post('/login', authController.login);
router.post('/verifyPhone', authController.verifyPhone);
router.get('/resendPhoneOtp', authController.resendVerifyPhoneOtp);
router.post('/verifyPassword', authController.verifyPassword);
router.get(
	'/forgotPasswordLoginViaOtp',
	authController.forgotPasswordLoginViaOtp
);
router.post('/verifyLoginOtp', authController.verifyLoginOtp);
router.get('/resendLoginOtp', authController.resendLoginOtp);

router.use(authController.protect);

router.get('/isLoggedIn', authController.isLoggedIn);
router.get('/logout', authController.logout);
router.post('/setPassword', authController.setPassword);
router.patch(
	'/uploadImage',
	multerUpload.single('image'),
	authController.uploadImage
);
router.get('/getMe', authController.getMe);
router.patch('/removeImage', authController.removeImage);

router.get('/requestPasswordReset', authController.requestPasswordReset);
router.post('/verifyPasswordResetOtp', authController.verifyPasswordResetOtp);

router.use(authController.restrictedTo('super-admin'));

router.post('/createAdmin', adminController.createAdmin);
router.patch('/disableEnableAdmin/:id', adminController.disableEnableAdmin);
router.delete('/deleteAdmin/:id', adminController.deleteAdmin);

module.exports = router;
