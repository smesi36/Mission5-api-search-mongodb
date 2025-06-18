import express from "express";
import { AuctionItems } from "../model/auctionItems.js";

const router = express.Router();

router.get("/api/search", async (req, res) => {
  // Extract the search keyword from query parameters
  const keyword = req.query.q || "";
  // confirm that the search request has been received
   console.log(`📥 Received search request for: "${keyword}"`);

  try {
    console.log(`🔍 Searching for: "${keyword}"`);
    let results = await AuctionItems.find(
      { $text: { $search: keyword } }, //full-text search query
      {
        score: { $meta: "textScore" }, //include text score in projection
        title: true, //or 1
        description: true,
        start_price: true,
        reserve_price: true,
      }
    ).sort({ score: { $meta: "textScore" } }); //sort by relevance

// If no results, try regex search for partial matches

    if (results.length === 0 && keyword) {
      const regex = new RegExp(keyword, 'i');
      results = await AuctionItems.find({
        $or: [
          { title: regex },
          { description: regex }
        ]
      });
    }

    // If no results are found, return a message and an empty array
    if (results.length === 0) {
      return res.status(200).json({
        message: "Your search did not find any results",
        results: [],
      });
    }
    // Return the results with a count of the number of results found
    console.log(`🔍 Search results for "${keyword}":`, results.length);

    res.status(200).json({results, count: results.length});
  } catch (error) {
    res.status(500).json({
      error: "Search failed",
      details: error.message,
    });
  }
});

export default router;
