const path = require('path');

const { Storage } = require('@google-cloud/storage');

const serviceKey = path.join(__dirname, '../../google-cloud-service-key.json');
const googleCloudService = new Storage({
	keyFilename: serviceKey,
	projectId: 'for-furs',
});
const googleCloudBucket = googleCloudService.bucket(
	process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME
);

module.exports = { googleCloudService, googleCloudBucket };
