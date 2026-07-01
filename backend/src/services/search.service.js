import client from "../config/typesense.js";

export const searchVideos = async (query, filters = {}, page = 1, limit = 20) => {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 50);

    const filterConditions = ["isPublished:=true"];
    if (filters.minDuration !== undefined && filters.minDuration !== null && !isNaN(filters.minDuration)) {
        filterConditions.push(`duration:>=${filters.minDuration}`);
    }
    if (filters.maxDuration !== undefined && filters.maxDuration !== null && !isNaN(filters.maxDuration)) {
        filterConditions.push(`duration:<=${filters.maxDuration}`);
    }
    if (filters.minViews !== undefined && filters.minViews !== null && !isNaN(filters.minViews)) {
        filterConditions.push(`views:>=${filters.minViews}`);
    }

    let sortByField = "_text_match:desc";
    if (filters.sortBy === "views") {
        sortByField = "views:desc";
    } else if (filters.sortBy === "createdAt") {
        sortByField = "createdAt:desc";
    }

    const searchParams = {
        q: query || "*",
        query_by: "title,description,tags",
        query_by_weights: "3,1,2",
        typo_tokens_threshold: 1,
        num_typos: 2,
        filter_by: filterConditions.join(" && "),
        sort_by: sortByField,
        page: pageNum,
        per_page: limitNum,
        highlight_full_fields: "title,description"
    };

    const searchResult = await client.collections("videos").documents().search(searchParams);

    const results = searchResult.hits.map(hit => ({
        ...hit.document,
        highlights: hit.highlights,
        textMatchScore: hit.text_match
    }));

    return { results, totalFound: searchResult.found, page: pageNum, limit: limitNum };
};

export const searchTweets = async (query, page = 1, limit = 20) => {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 50);

    const searchParams = {
        q: query || "*",
        query_by: "content,hashtags",
        query_by_weights: "2,1",
        num_typos: 2,
        page: pageNum,
        per_page: limitNum,
        sort_by: "_text_match:desc,createdAt:desc"
    };

    const searchResult = await client.collections("tweets").documents().search(searchParams);

    const results = searchResult.hits.map(hit => ({
        ...hit.document,
        highlights: hit.highlights,
        textMatchScore: hit.text_match
    }));

    return { results, totalFound: searchResult.found, page: pageNum, limit: limitNum };
};

export const searchAll = async (query, page = 1, limit = 20) => {
    const [videosResult, tweetsResult] = await Promise.all([
        searchVideos(query, {}, page, limit),
        searchTweets(query, page, limit)
    ]);

    return {
        videos: { results: videosResult.results, totalFound: videosResult.totalFound },
        tweets: { results: tweetsResult.results, totalFound: tweetsResult.totalFound }
    };
};

export const getAutocompleteSuggestions = async (partialQuery) => {
    const searchParams = {
        q: partialQuery,
        query_by: "title",
        num_typos: 1,
        per_page: 8,
        prefix: true,
        filter_by: "isPublished:=true"
    };

    const searchResult = await client.collections("videos").documents().search(searchParams);

    const titles = searchResult.hits.map(hit => hit.document.title);
    const uniqueTitles = [...new Set(titles)];

    return uniqueTitles;
};
