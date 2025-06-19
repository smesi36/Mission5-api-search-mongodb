import express from "express";
import { AuctionItems } from "../model/auctionItems.js";

const router = express.Router();

router.get("/api/search", async (req, res) => {
  // Extract the search keyword from query parameters
  const keyword = req.query.q || "";

  // remove whitespace from the keyword
  const trimmedKeyword = keyword.trim();
  // Prevent short or empty search queries
  if (!trimmedKeyword || trimmedKeyword.length < 3) {
    return res.status(400).json({
      error: "Please provide a keyword with at least 3 characters.",
    });
  }

  // confirm that the search request has been received
  console.log(`📥 Received search request for: "${trimmedKeyword}"`);

  try {
    // full-text search
    console.log(`🔍 Searching for: "${trimmedKeyword}"`);
    let results = await AuctionItems.find(
      { $text: { $search: trimmedKeyword } }, //full-text search query
      {
        score: { $meta: "textScore" }, //include text score in projection
        title: true, //or 1
        description: true,
        start_price: true,
        reserve_price: true,
      }
    ).sort({ score: { $meta: "textScore" } }); //sort by relevance

    // Store the number of results found with full-text search
    console.log(
      `🔍 Full-text search results for "${trimmedKeyword}":`,
      results.length
    );
    const fullTextMatchCount = results.length;

    // If full-text search results are too few, use regular expression search

    if (trimmedKeyword && results.length < 6) {
      const regex = new RegExp(trimmedKeyword, "i");
      const regexResults = await AuctionItems.find({
        $or: [{ title: regex }, { description: regex }],
      });

      // Filter out duplicate results based on _id
      const existingResults = new Set(
        results.map((item) => item._id.toString())
      );
      const newResults = regexResults.filter(
        (item) => !existingResults.has(item._id.toString())
      );
      // Combine both sets of results using spread operator
      results = [...results, ...newResults];
    }

    // Return the results with a count of the number of results found
    console.log(`🔍 Search results for "${keyword}":`, results.length);

    // If no results are found, return a message and an empty array
    if (results.length === 0) {
      return res.status(200).json({
        message: "Your search did not find any results",
        results: [],
        fallbackApplied: false,
      });
    }

    res.status(200).json({
      results,
      count: results.length,
      fallbackApplied: results.length > fullTextMatchCount,
    });
  } catch (error) {
    res.status(500).json({
      error: "Search failed",
      details: error.message,
    });
  }
});

export default router;
