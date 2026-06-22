import { ApiError } from "../utils/ApiError.js";

const uploadGuard = (req, res, next) => {
    const { contentType, fileSize } = req.body;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (!contentType) {
        throw new ApiError(400, "contentType is required");
    }

    if (!allowedTypes.includes(contentType)) {
        throw new ApiError(415, "Unsupported file type");
    }

    if (fileSize === undefined || fileSize === null) {
        throw new ApiError(400, "fileSize is required");
    }

    if (fileSize > 524288000) {
        throw new ApiError(413, "File too large. Maximum is 500MB");
    }

    next();
};

export default uploadGuard;
