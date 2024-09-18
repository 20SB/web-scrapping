const puppeteer = require("puppeteer");

module.exports.fillForm = async (req, res) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Open the Google Form page
        await page.goto(req.query.url, { waitUntil: "networkidle2" });

        // Fill out the form fields
        await page.type('input[aria-labelledby="i1"]', req.query.name);
        await page.type('input[aria-labelledby="i5"]', req.query.phone);

        // Submit the form
        await page.click("text=Submit");
        await page.waitForNavigation();

        const pageResponse = await page.content();
        res.send(pageResponse);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred while filling the form.");
    } finally {
        await browser.close();
    }
};
