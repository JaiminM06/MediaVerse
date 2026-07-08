import Notification from "../models/notification.model.js";
import { getIO } from "../config/socket.js";
import { logger } from "../utils/logger.js";

export const sendNotification = async (payload) => {
    const { recipientId, senderId, type, referenceId, referenceModel, message } = payload;

    // 1. Create and save a Notification document in MongoDB
    const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        referenceId,
        referenceModel,
        message
    });

    // Populate sender info for frontend rendering
    const savedNotification = await Notification.findById(notification._id)
        .populate("sender", "username avatar");

    // 2. Emit to the recipient's personal Socket.IO room (managed globally via Redis adapter)
    try {
        const io = getIO();
        io.to(`user-${recipientId}`).emit("notification", { notification: savedNotification });
    } catch (socketError) {
        logger.error({ err: socketError, recipientId }, "Failed to deliver real-time notification");
    }

    return savedNotification;
};
