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

/**
 * @openapi
 * /search:
 *   get:
 *     summary: Search videos with filters
 *     description: Searches for published videos using text matching, tags, and custom filters. Saves query to search history if authenticated.
 *     tags:
 *       - Search
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: filter
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route("/").get(optionalAuth, search);

/**
 * @openapi
 * /search/autocomplete:
 *   get:
 *     summary: Autocomplete search suggestions
 *     description: Provides instantaneous query suggestions as the user types in the search bar.
 *     tags:
 *       - Search
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Autocomplete suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route("/autocomplete").get(autocomplete);

/**
 * @openapi
 * /search/history:
 *   get:
 *     summary: Get user search history
 *     description: Retrieves the search history entries for the currently authenticated user.
 *     tags:
 *       - Search
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Search history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Clear user search history
 *     description: Deletes all search history entries associated with the authenticated user.
 *     tags:
 *       - Search
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Search history cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/history").get(verifyJWT, getMySearchHistory);
router.route("/history").delete(verifyJWT, clearSearchHistory);

/**
 * @openapi
 * /search/history/entry:
 *   delete:
 *     summary: Delete a single search history entry
 *     description: Removes a specific query from the user's search history list.
 *     tags:
 *       - Search
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: queryId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search history entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: queryId query parameter is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/history/entry").delete(verifyJWT, deleteOneSearchEntry);

export default router;
