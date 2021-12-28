const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const AppError = require('./utility/appError');
const globalErrorHandler = require('./utility/globalErrorHandler');

const userRoutes = require('./Users/routes');
const adminAuthRoutes = require('./Admins/routes');
const brandsRoutes = require('./Products/Brands/routes');
const categoriesRoutes = require('./Products/Categories/routes');
const productsRoutes = require('./Products/Products/routes');
const serviceRoutes = require('./Services/routes');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(
	express.json({
		limit: '10kb',
		verify: (req, res, buf) => {
			var url = req.originalUrl;
			if (url === '/api/v1/user/stripePaymentSuccessfull') {
				req.rawBody = buf.toString();
			}
		},
	})
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/admin', adminAuthRoutes);
app.use('/api/v1/brands', brandsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/services', serviceRoutes);

app.use('*', (req, res, next) => {
	next(new AppError(404, 'Page not found.', 'Not Found'));
});

app.use(globalErrorHandler);

module.exports = app;
