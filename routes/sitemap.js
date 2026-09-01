const express = require("express");
const { SitemapStream, streamToPromise } = require("sitemap");
const { Story } = require("../models");

const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {
  try {
    const sitemap = new SitemapStream({
      hostname: "https://www.mahokofridaynews.com",
    });

    // =========================================================
    // 1. MAIN PUBLIC PAGES
    // =========================================================

    sitemap.write({
      url: "/",
      changefreq: "daily",
      priority: 1.0,
    });

    sitemap.write({
      url: "/about",
      changefreq: "monthly",
      priority: 0.7,
    });

    sitemap.write({
      url: "/contact",
      changefreq: "monthly",
      priority: 0.6,
    });

    sitemap.write({
      url: "/subscribe",
      changefreq: "monthly",
      priority: 0.6,
    });

    sitemap.write({
      url: "/privacy",
      changefreq: "yearly",
      priority: 0.4,
    });

    sitemap.write({
      url: "/videos",
      changefreq: "weekly",
      priority: 0.7,
    });

    // =========================================================
    // 2. CATEGORY PAGES
    // =========================================================

    const categories = [
      "business",
      "sport",
      "technology",
      "health",
      "culture",
      "environment",
    ];

    categories.forEach((category) => {
      sitemap.write({
        url: `/category/${category}`,
        changefreq: "daily",
        priority: 0.8,
      });
    });

    // =========================================================
    // 3. GET ALL PUBLISHED ARTICLES FROM MONGODB
    // =========================================================

    const stories = await Story.find({
      status: "published",
    })
      .select("_id slug createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    // =========================================================
    // 4. ADD EVERY ARTICLE TO THE SITEMAP
    // =========================================================

    stories.forEach((story) => {

      // Use slug if your article has one.
      // Otherwise use MongoDB ID.
      const articleIdentifier = story.slug || story._id.toString();

      sitemap.write({
        url: `/story/${articleIdentifier}`,
        lastmod: story.updatedAt || story.createdAt,
        changefreq: "weekly",
        priority: 0.8,
      });

    });

    // Finish sitemap
    sitemap.end();

    // Convert sitemap stream to XML
    const sitemapXML = await streamToPromise(sitemap);

    // Tell browser/Google this is XML
    res.set("Content-Type", "application/xml");

    res.send(sitemapXML.toString());

  } catch (error) {

    console.error("Sitemap generation error:", error);

    res.status(500).send("Could not generate sitemap");

  }
});

module.exports = router;