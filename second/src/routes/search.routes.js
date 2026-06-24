import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import {
    search,
    autocomplete,
    getMySearchHistory,
    clearSearchHistory,
    deleteOneSearchEntry
} from "../controllers/search.controller.js";

const router = Router();

router.route("/").get(optionalAuth, search);
router.route("/autocomplete").get(autocomplete);
router.route("/history").get(verifyJWT, getMySearchHistory);
router.route("/history").delete(verifyJWT, clearSearchHistory);
router.route("/history/entry").delete(verifyJWT, deleteOneSearchEntry);

export default router;
