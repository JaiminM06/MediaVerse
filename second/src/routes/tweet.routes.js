import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {validate} from "../middlewares/validate.middleware.js"
import {createTweetSchema, updateTweetSchema} from "../validators/tweet.validators.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(validate(createTweetSchema), createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId")
    .patch(validate(updateTweetSchema), updateTweet)
    .delete(deleteTweet);

export default router;