import { Router } from "express";
import {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createCommentSchema, updateCommentSchema } from "../validators/comment.validators.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComments);
router.route("/v/:videoId").post(validate(createCommentSchema), addComment);

router.route("/:commentId")
    .patch(validate(updateCommentSchema), updateComment)
    .delete(deleteComment);

export default router;
