const express = require("express");
const { SitemapStream, streamToPromise } = require("sitemap");
const { Story } = require("../models");

const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {
  try {
    const sitemap = new SitemapStream({
      hostname: "https://mahokofridaynews.com",
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
      url: "/archive",
      changefreq: "weekly",
      priority: 0.8,
    });

    sitemap.write({
      url: "/e-paper",
      changefreq: "weekly",
      priority: 0.8,
    });

    sitemap.write({
      url: "/about",
      changefreq: "monthly",
      priority: 0.7,
    });

    sitemap.write({
      url: "/newsletter",
      changefreq: "monthly",
      priority: 0.6,
    });

    sitemap.write({
      url: "/terms",
      changefreq: "yearly",
      priority: 0.3,
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
    // 2. MAIN CATEGORY PAGES
    // =========================================================

    sitemap.write({
      url: "/category/business",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/sport",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/technology",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/health",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/culture",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/entertainment",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/education",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/religion",
      changefreq: "daily",
      priority: 0.8,
    });

    // =========================================================
    // 3. MORE DROPDOWN CATEGORY PAGES
    // =========================================================

    sitemap.write({
      url: "/category/le-phare",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/environment",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/music",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/transport",
      changefreq: "daily",
      priority: 0.8,
    });

    sitemap.write({
      url: "/category/joblinks",
      changefreq: "daily",
      priority: 0.8,
    });

    // =========================================================
    // 4. GET ALL PUBLISHED STORIES FROM MONGODB
    // =========================================================

    const stories = await Story.find({
      status: "published",
    })
      .select("_id createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    // =========================================================
    // 5. ADD EVERY PUBLISHED STORY
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
    // 6. FINISH SITEMAP
    // =========================================================

    sitemap.end();

    const sitemapXML = await streamToPromise(sitemap);

    // =========================================================
    // 7. SEND XML
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