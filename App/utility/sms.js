/* eslint-disable no-unused-vars */
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

exports.welcomeMessage = async (to) => {
	// await client.messages.create({
	//   body: `Welcome to For Furs\nYou successfully registered.`,
	//   from: process.env.TWILIO_PHONE,
	//   to: to,
	// });
};

exports.sendOtp = async (to, otp) => {
	// await client.messages.create({
	//   body: `Your ForFurs verification code is: ${otp}\nvalid for 10 minutes only`,
	//   from: process.env.TWILIO_PHONE,
	//   to: to,
	// });
};

exports.phoneVerified = async (to) => {
	// await client.messages.create({
	//   body: `You successfully verified you phone number.`,
	//   from: process.env.TWILIO_PHONE,
	//   to: to,
	// });
};
