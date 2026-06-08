const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath, folder = 'pos_uploads') => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'dummy_cloudinary_name') {
      logger.info(`[Cloudinary Sandbox] Mock upload for: ${filePath}`);
      return {
        secure_url: `https://res.cloudinary.com/sandbox/image/upload/mock_${Date.now()}.png`,
        public_id: `mock_public_id_${Date.now()}`
      };
    }
    const result = await cloudinary.uploader.upload(filePath, { folder });
    return result;
  } catch (error) {
    logger.error(`Cloudinary Upload Error: ${error.message}`);
    throw error;
  }
};

const deleteImage = async (publicId) => {
  try {
    if (!publicId || publicId.startsWith('mock_')) {
      logger.info(`[Cloudinary Sandbox] Mock delete for: ${publicId}`);
      return { result: 'ok' };
    }
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error(`Cloudinary Delete Error: ${error.message}`);
    throw error;
  }
};

module.exports = { cloudinary, uploadImage, deleteImage };
