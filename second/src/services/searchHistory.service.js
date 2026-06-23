import { User } from "../models/user.model.js";

/**
 * Saves a user's search query, ensuring no case-insensitive duplicates
 * exist, keeping only the 10 most recent searches.
 */
export const saveSearchQuery = async (userId, query) => {
    if (!userId || !query || !query.trim()) return;

    const trimmedQuery = query.trim();
    const escapedQuery = trimmedQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

    try {
        // 1. Pull any existing duplicate case-insensitively
        await User.findByIdAndUpdate(userId, {
            $pull: {
                searchHistory: {
                    query: { $regex: new RegExp("^" + escapedQuery + "$", "i") }
                }
            }
        });

        // 2. Prepend the new query and slice to max 10 entries
        await User.findByIdAndUpdate(userId, {
            $push: {
                searchHistory: {
                    $each: [{ query: trimmedQuery, searchedAt: new Date() }],
                    $position: 0,
                    $slice: 10
                }
            }
        });
    } catch (error) {
        console.error(`Failed to save search query for user ${userId}:`, error.message);
    }
};

/**
 * Fetches the user's search history, sorted by searchedAt descending.
 */
export const getSearchHistory = async (userId) => {
    if (!userId) return [];

    try {
        const user = await User.findById(userId).select("searchHistory");
        if (!user || !user.searchHistory) return [];

        // Return sorted by searchedAt descending
        return [...user.searchHistory].sort((a, b) => b.searchedAt - a.searchedAt);
    } catch (error) {
        console.error(`Failed to get search history for user ${userId}:`, error.message);
        return [];
    }
};
