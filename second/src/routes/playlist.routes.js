import { Router } from 'express';
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.contorller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { validate } from "../middlewares/validate.middleware.js"
import { createPlaylistSchema, updatePlaylistSchema } from "../validators/playlist.validators.js"

const router = Router();
router.use(verifyJWT);

router
    .route("/")
    .post(validate(createPlaylistSchema), createPlaylist);

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(validate(updatePlaylistSchema), updatePlaylist)
    .delete(deletePlaylist);

router.route("/user/:userId").get(getUserPlaylists);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

export default router;
