/* eslint-disable no-console */
// eslint-disable-next-line no-unused-vars
const colors = require('colors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = require('./App/app');

process.on('uncaughtException', (err) => {
	console.log(err.name, err.message);
	console.log('UNCAUGHT EXCEPTION!! Shutting down...');
	process.exit(1);
});

let DB;
const DBCredentials = './for_furs.pem';
const DBConnectionOptions = {};

if (process.env.NODE_ENV == 'production') {
	DB = process.env.DATABASE;
	DBConnectionOptions.sslKey = DBCredentials;
	DBConnectionOptions.sslCert = DBCredentials;
} else {
	DB = process.env.DATABASE_LOCAL;
}

mongoose.connect(DB, DBConnectionOptions).then(() => {
	console.log('DB connection successful.'.green);
});

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
	console.log(
		'-----------------------------------------------------------'.green
	);
	console.log(`App running on port ${port}...`.green);
	console.log(`NODE_ENV: ${process.env.NODE_ENV}`.green);
});

process.on('unhandledRejection', (err) => {
	console.log(err.name, err.message);
	console.log('UNHANDLED REJECTION!! Shutting down...');

	server.close(() => {
		process.exit(1);
	});
});

process.on('SIGTERM', () => {
	console.log('SIGTERM RECEIVED. Shutting down gracefully');
	server.close(() => {
		console.log('Process terminated');
	});
});
