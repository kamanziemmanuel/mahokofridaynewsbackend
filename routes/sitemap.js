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
    // 2. PUBLIC CATEGORY PAGES
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
    // 3. GET ALL PUBLISHED STORIES FROM MONGODB
    // =========================================================

    const stories = await Story.find({
      status: "published",
    })
      .select("_id createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    // =========================================================
    // 4. ADD EVERY PUBLISHED STORY
    // =========================================================

    stories.forEach((story) => {
      if (!story._id) return;

      sitemap.write({
        url: `/story/${story._id.toString()}`,
        lastmod: story.updatedAt || story.createdAt,
        changefreq: "weekly",
        priority: 0.8,
      });
    });

    // =========================================================
    // 5. FINISH SITEMAP
    // =========================================================

    sitemap.end();

    const sitemapXML = await streamToPromise(sitemap);

    // =========================================================
    // 6. SEND XML TO GOOGLE
    // =========================================================

    res.set("Content-Type", "application/xml; charset=utf-8");

    return res.send(sitemapXML.toString());

  } catch (error) {
    console.error("Sitemap generation error:", error);

    return res.status(500).send(
      "Could not generate sitemap"
    );
  }
});

module.exports = router;