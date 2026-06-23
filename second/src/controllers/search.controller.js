import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {
    searchVideos,
    searchTweets,
    searchAll,
    getAutocompleteSuggestions
} from "../services/search.service.js";
import {
    saveSearchQuery,
    getSearchHistory
} from "../services/searchHistory.service.js";

/**
 * Executes a full-text search across videos, tweets, or both.
 * Auth is optional (records search history if user is authenticated).
 */
export const search = asyncHandler(async (req, res) => {
    const { q, type = "all", page = 1, limit = 20, minDuration, maxDuration, minViews, sortBy } = req.query;

    if (!q || !q.trim()) {
        throw new ApiError(400, "Search query is required");
    }

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 50);

    const filters = { sortBy };
    if (minDuration !== undefined && minDuration !== "") {
        const parsed = Number(minDuration);
        if (!isNaN(parsed)) filters.minDuration = parsed;
    }
    if (maxDuration !== undefined && maxDuration !== "") {
        const parsed = Number(maxDuration);
        if (!isNaN(parsed)) filters.maxDuration = parsed;
    }
    if (minViews !== undefined && minViews !== "") {
        const parsed = Number(minViews);
        if (!isNaN(parsed)) filters.minViews = parsed;
    }

    let searchResult;
    if (type === "video") {
        searchResult = await searchVideos(q, filters, pageNum, limitNum);
    } else if (type === "tweet") {
        searchResult = await searchTweets(q, pageNum, limitNum);
    } else {
        searchResult = await searchAll(q, pageNum, limitNum);
    }

    // Save history if user is authenticated (fire-and-forget)
    if (req.user?._id) {
        saveSearchQuery(req.user._id, q).catch(err =>
            console.error("Failed to save search history:", err.message)
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                results: type === "all" ? searchResult : searchResult.results,
                totalFound: type === "all" ? undefined : searchResult.totalFound,
                page: pageNum,
                limit: limitNum
            },
            "Search results fetched successfully"
        )
    );
});

/**
 * Autocomplete prefix matching suggestions
 */
export const autocomplete = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        throw new ApiError(400, "Query must be at least 2 characters long");
    }

    const suggestions = await getAutocompleteSuggestions(q.trim());

    return res.status(200).json(
        new ApiResponse(200, { suggestions }, "Suggestions fetched successfully")
    );
});

/**
 * Gets the logged in user's search history
 */
export const getMySearchHistory = asyncHandler(async (req, res) => {
    const history = await getSearchHistory(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, { history }, "Search history fetched successfully")
    );
});

/**
 * Clears all user's search history
 */
export const clearSearchHistory = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { searchHistory: [] } });

    return res.status(200).json(
        new ApiResponse(200, null, "Search history cleared successfully")
    );
});

/**
 * Deletes a single entry from user's search history
 */
export const deleteOneSearchEntry = asyncHandler(async (req, res) => {
    const { query } = req.body;

    if (!query || !query.trim()) {
        throw new ApiError(400, "Query string is required to delete entry");
    }

    await User.findByIdAndUpdate(req.user._id, {
        $pull: { searchHistory: { query: query.trim() } }
    });

    return res.status(200).json(
        new ApiResponse(200, null, "Search entry removed successfully")
    );
});
