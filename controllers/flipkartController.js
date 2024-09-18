const puppeteer = require("puppeteer");

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports.scrapeFlipkartData = async (req, res) => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(10 * 60 * 1000);

    // Listen for console messages from the page
    page.on("console", (msg) => {
        console.log("PAGE LOG:", msg.text());
    });

    try {
        // Navigate to the page with products
        await page.goto(req.query.url, { waitUntil: "networkidle2" });

        // hover on fashion
        // await page.evaluate(() => {
        //     console.log("inside evaluate func");
        //     const productType = document.querySelector('[aria-label="Fashion"]');
        //     console.log("Searched for product Type");

        //     if (productType) {
        //         console.log("Found product Type");
        //         const mouseOverEvent = new MouseEvent("mouseover", {
        //             bubbles: true,
        //             cancelable: true,
        //             view: window,
        //         });
        //         productType.dispatchEvent(mouseOverEvent);

        //         const subproductTypes = document.querySelectorAll("a._1BJVlg");
        //         console.log("Searched for sub product Types");
        //         console.log(subproductTypes);
        //     }
        // });

        // get all the lists

        // ?click on sublist

        let allProducts = [];

        for (let i = 1; i <= 1; i++) {
            console.log("restarting loop for-", i);
            // Fetch data for products on the current page
            await page.waitForSelector("div[data-id]", { visible: true });

            console.log("dataId Found");
            const productElements = await page.$$("div[data-id]"); // Get product elements using Puppeteer's selector

            for (const product of productElements) {
                // Simulate hovering over the product
                await product.hover();
                await delay(1000);

                const productData = await page.evaluate((product) => {
                    const name = product.querySelector(".WKTcLC")?.innerText || null;
                    const price = product.querySelector(".Nx9bqj")?.innerText || null;
                    const discount = product.querySelector(".UkUFwK span")?.innerText || null;
                    const sizes = product.querySelector(".OCRRMR")?.innerText || null;
                    const imageUrl = product.querySelector("img")?.src || null;
                    const productUrl = product.querySelector("a")?.href || null;

                    return {
                        name,
                        price,
                        discount,
                        sizes,
                        imageUrl,
                        productUrl,
                    };
                }, product);


                allProducts.push(productData); // Append data to the allProducts array
            }

            console.log("products page- ", i, " total: ", allProducts.length);

            // Click on the "Next" button if it's available
            const nextButton = await page.$("nav a._9QVEpD");
            if (nextButton) {
                await nextButton.click();
                console.log("Clicked next btn, waiting for navigation");
                await delay(3000); // Wait for navigation
                console.log("navigation waiting completed");
            } else {
                break;
            }
        }

        res.json({ totalProductsCount: allProducts.length, allProducts });
        // res.json({ mesage: "success" });
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred while scraping.");
    } finally {
        await browser.close();
    }
};
