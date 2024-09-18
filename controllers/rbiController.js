const puppeteer = require("puppeteer");
const Speech = require("../models/Speech");

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports.scrapeRbiPdfs = async (req, res) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(req.query.url, { waitUntil: "load" });

        const scrappedData = await page.evaluate(() => {
            const pdfTable = document.querySelector(".tablebg");
            if (!pdfTable) return [];

            const pdfLinks = [];
            const pdfs = [];
            const rows = pdfTable.querySelectorAll("tr");

            let currentDate = "";

            rows.forEach((row) => {
                const dateHeader = row.querySelector(".tableheader");
                if (dateHeader) {
                    currentDate = dateHeader.textContent.trim();
                }

                const link = row.querySelector('td[colspan="3"] a');
                if (link) {
                    pdfs.push({
                        date: currentDate,
                        title: row.querySelector(".link2").textContent.trim(),
                        speechLink: row.querySelector(".link2").href,
                        pdfLink: link.href,
                        pdfSize: row.querySelector('td[colspan="3"]').textContent.trim(),
                    });
                    pdfLinks.push(link.href);
                }
            });

            return { pdfLinks, speeches: pdfs };
        });

        res.json(scrappedData);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred while scraping.");
    } finally {
        await browser.close();
    }
};

module.exports.scrapeRbiPdfsOfParticularTimePeriod = async (req, res) => {
    const { url, year, month } = req.query;

    if (!url || !year || month === undefined) {
        return res.status(400).send("Missing required query parameters: url, year, month");
    }

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: "networkidle2" });

        if (year <= new Date().getFullYear() - 10) {
            await page.click(`#divArchiveMain`);
        }

        await page.waitForSelector(`#btn${year}`, { visible: true });
        await page.click(`#btn${year}`);

        const monthIndex = parseInt(month, 10);
        await page.waitForSelector(`a[id="${year}${monthIndex}"]`, { visible: true });
        await page.click(`a[id="${year}${monthIndex}"]`);

        await page.waitForSelector(".tablebg", { visible: true });

        const scrappedData = await page.evaluate(() => {
            const pdfTable = document.querySelector(".tablebg");
            if (!pdfTable) return [];

            const pdfLinks = [];
            const pdfs = [];
            const rows = pdfTable.querySelectorAll("tr");

            let currentDate = "";

            rows.forEach((row) => {
                const dateHeader = row.querySelector(".tableheader");
                if (dateHeader) {
                    currentDate = dateHeader.textContent.trim();
                }

                const link = row.querySelector('td[colspan="3"] a');
                if (link) {
                    pdfs.push({
                        date: currentDate,
                        title: row.querySelector(".link2").textContent.trim(),
                        speechLink: row.querySelector(".link2").href,
                        pdfLink: link.href,
                        pdfSize: row.querySelector('td[colspan="3"]').textContent.trim(),
                    });
                    pdfLinks.push(link.href);
                }
            });

            // return { pdfLinks, speeches: pdfs };
            return { pdfs };
        });

        res.json(scrappedData);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred while scraping.");
    } finally {
        await browser.close();
    }
};

module.exports.scrapeRbiSpeechesFromHome = async (req, res) => {
    const { url, year, month } = req.query;

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: "networkidle2" });

        // Hover over "Speeches & Media Interactions"
        const menuItem = await page.waitForSelector("text=Speeches & Media Interactions", {
            visible: true,
        });
        await menuItem.hover();

        const siblingElement = await page.evaluateHandle((menuItem) => {
            return menuItem.nextElementSibling;
        }, menuItem);

        const speechesItem = await page.evaluateHandle((ulElement) => {
            const listItems = ulElement.querySelectorAll("li");
            for (const item of listItems) {
                if (item.innerText.trim() === "Speeches") {
                    console.log("Found the 'Speeches' element.");
                    return item;
                }
            }
            return null;
        }, siblingElement);

        await speechesItem.click();

        await page.waitForNavigation({ waitUntil: "networkidle2" });

        if (year <= new Date().getFullYear() - 10) {
            await page.click(`#divArchiveMain`);
        }

        // await page.waitForSelector(`#btn${year}`, { visible: true });
        // await page.click(`#btn${year}`);

        const monthIndex = parseInt(month, 10);
        // await page.waitForSelector(`a[id="${year}${monthIndex}"]`, { visible: true });
        // await page.click(`a[id="${year}${monthIndex}"]`);

        await page.evaluate(
            (year, monthIndex) => {
                const element = document.getElementById(`${year}${monthIndex}`);
                if (element) {
                    element.click();
                }
            },
            year,
            monthIndex
        );

        await page.waitForSelector(".tablebg", { visible: true });

        const scrappedData = await page.evaluate(() => {
            const pdfTable = document.querySelector(".tablebg");
            if (!pdfTable) return [];

            const pdfLinks = [];
            const pdfs = [];
            const rows = pdfTable.querySelectorAll("tr");

            let currentDate = "";

            rows.forEach((row) => {
                const dateHeader = row.querySelector(".tableheader");
                if (dateHeader) {
                    currentDate = dateHeader.textContent.trim();
                }

                const link = row.querySelector('td[colspan="3"] a');
                if (link) {
                    pdfs.push({
                        date: currentDate,
                        title: row.querySelector(".link2").textContent.trim(),
                        speechLink: row.querySelector(".link2").href,
                        pdfLink: link.href,
                        pdfSize: row.querySelector('td[colspan="3"]').textContent.trim(),
                    });
                    pdfLinks.push(link.href);
                }
            });

            // return { pdfLinks, speeches: pdfs };
            return pdfs;
        });

        res.json(scrappedData);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred while scraping.");
    } finally {
        await browser.close();
    }
};

module.exports.scrapeRbiSpeeches = async (req, res) => {
    const { url } = req.query;
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: "load" });

        // Hover over "Speeches & Media Interactions"
        const menuItem = await page.waitForSelector("text=Speeches & Media Interactions", {
            visible: true,
        });
        await menuItem.hover();

        const siblingElement = await page.evaluateHandle(
            (menuItem) => menuItem.nextElementSibling,
            menuItem
        );

        const speechesItem = await page.evaluateHandle((ulElement) => {
            const listItems = ulElement.querySelectorAll("li");
            for (const item of listItems) {
                if (item.innerText.trim() === "Speeches") {
                    console.log("Found the 'Speeches' element.");
                    return item;
                }
            }
            return null;
        }, siblingElement);

        await speechesItem.click();
        await page.waitForNavigation({ waitUntil: "networkidle2" });

        // Get the current year
        const currentYear = new Date().getFullYear();

        let totalNewData = 0;
        let totalscrapedData = 0;

        // Fetch all existing speeches from the database and store them in a hashmap
        const allSpeeches = await Speech.find({});
        const speechMap = new Map();
        allSpeeches.forEach((speech) => {
            const key = `${speech.date}-${speech.title}-${speech.speechLink}-${speech.pdfLink}`;
            speechMap.set(key, true);
        });

        console.log("speechMap", speechMap);

        // Loop through years until there is no data left
        for (let year = currentYear; year >= 1990; year--) {
            await delay(2000);
            console.log(`Processing year: ${year}`);

            await page.evaluate((year) => {
                const element = document.getElementById(`${year}0`);
                if (element) {
                    element.click();
                }
            }, year);

            await page.waitForSelector(".tablebg", { visible: true });

            // Scrape the data
            const scrapedData = await page.evaluate(() => {
                const pdfTable = document.querySelector(".tablebg");
                if (!pdfTable) return [];

                const pdfs = [];
                const rows = pdfTable.querySelectorAll("tr");

                let currentDate = "";

                rows.forEach((row) => {
                    const dateHeader = row.querySelector(".tableheader");
                    if (dateHeader) {
                        currentDate = dateHeader.textContent.trim();
                    }

                    const link = row.querySelector('td[colspan="3"] a');
                    if (link) {
                        const speechData = {
                            date: currentDate,
                            title: row.querySelector(".link2").textContent.trim(),
                            speechLink: row.querySelector(".link2").href,
                            pdfLink: link.href,
                            pdfSize: row.querySelector('td[colspan="3"]').textContent.trim(),
                        };

                        pdfs.push(speechData);
                    }
                });

                return pdfs;
            });

            console.log(`scrapedData for ${year}= ${scrapedData.length}`);

            totalscrapedData += scrapedData.length;
            // Check for duplicates using the hashmap and filter out existing data
            const newSpeeches = scrapedData.filter((speechData) => {
                const key = `${speechData.date}-${speechData.title}-${speechData.speechLink}-${speechData.pdfLink}`;
                return !speechMap.has(key);
            });

            // Insert new speeches into the database
            if (newSpeeches.length > 0) {
                await Speech.insertMany(newSpeeches);
                console.log(`Data for ${year} saved!`);
                totalNewData += newSpeeches.length;

                // Update the hashmap with newly added speeches
                newSpeeches.forEach((speechData) => {
                    const key = `${speechData.date}-${speechData.title}-${speechData.speechLink}-${speechData.pdfLink}`;
                    speechMap.set(key, true);
                });
            } else {
                console.log(`No new data found for ${year}`);
            }
        }

        res.json({
            message: "Scraping and saving data completed!",
            totalNewData,
            totalscrapedData,
        });
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred while scraping.");
    } finally {
        await browser.close();
    }
};
