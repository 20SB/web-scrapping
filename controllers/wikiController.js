const puppeteer = require("puppeteer");
const WikiPage = require("../models/WikiPage");

module.exports.scrapeWikipedia = async (req, res) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto(req.query.url, { waitUntil: "networkidle2" });

        // Set screen size
        await page.setViewport({ width: 1920, height: 1080 });

        // Type the search query
        await page.type("#searchInput", req.query.searchQuery);

        console.log("search queried");

        await page.click(".cdx-button.cdx-search-input__end-button");

        console.log("clicked search btn");

        await page.waitForNavigation({ waitUntil: "networkidle2" });

        console.log("moved  to search results");

        // Extract the infobox data
        const data = await page.evaluate(() => {
            const infobox = document.querySelector(".infobox");
            if (!infobox) return null;

            const getImageSrc = () => {
                const image = infobox.querySelector(".infobox-image img");
                return image ? image.src : "";
            };

            const extractDetails = (rowSelector) => {
                const rows = infobox.querySelectorAll(rowSelector);
                const details = {};
                rows.forEach((row) => {
                    const key = row.querySelector(".infobox-label")?.textContent.trim() || "";
                    const value = row.querySelector(".infobox-data")?.textContent.trim() || "";
                    if (key) details[key] = value;
                });
                return details;
            };

            return {
                title: document.title,
                image: getImageSrc(),
                details: extractDetails("tr"),
            };
        });

        const wikiPage = new WikiPage(data);
        await wikiPage.save();

        res.json({ title: data.title, image: data.image, details: data.details });
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred while scraping.");
    } finally {
        await browser.close();
    }
};
