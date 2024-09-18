const puppeteer = require("puppeteer");
const Speech = require("../models/Speech");

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports.scrapeRbiPdfs = async (req, res) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(req.query.url, { waitUntil: "networkidle2" });

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

        // Get the current year
        const currentYear = new Date().getFullYear();

        let totalNewData = 0;

        // Loop through years until there is no data left
        for (let year = currentYear; year >= 1990; year--) {
            await delay(2000);
            console.log(`Processing year: ${year}`);

            // Method: 1
            await page.evaluate((year) => {
                const element = document.getElementById(`${year}0`);
                if (element) {
                    element.click();
                }
            }, year);

            // Method: 2
            // if (year == new Date().getFullYear() - 9) {
            //     await page.click(`#divArchiveMain`);
            // }

            // // If top button is visible then click on top
            // await page.evaluate(() => {
            //     const element = document.getElementById(`backToTop`);
            //     if (
            //         element &&
            //         (getComputedStyle(element).display === "inline" ||
            //             getComputedStyle(element).display === "block")
            //     ) {
            //         console.log("Found top button and clicked");
            //         element.click();
            //     } else {
            //         console.log("Top button not found or not visible");
            //     }
            // });

            // // Then click on year button
            // await page.waitForSelector(`#btn${year}`, { visible: true });
            // await page.click(`#btn${year}`);

            // // If top button is visible then click on top
            // await page.evaluate(() => {
            //     const element = document.getElementById(`backToTop`);
            //     if (
            //         element &&
            //         (getComputedStyle(element).display === "inline" ||
            //             getComputedStyle(element).display === "block")
            //     ) {
            //         console.log("Found top button and clicked");
            //         element.click();
            //     } else {
            //         console.log("Top button not found or not visible");
            //     }
            // });

            // // Then click on All Months button
            // await page.waitForSelector(`a[id="${year}0"]`, { visible: true });
            // await page.click(`a[id="${year}0"]`);

            await page.waitForSelector(".tablebg", { visible: true });

            // Scrape the data
            const scrappedData = await page.evaluate(() => {
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

            // After retrieving scrappedData, check for duplicates in the database
            const pdfPromises = scrappedData.map(async (speechData) => {
                const speech = await Speech.findOne({
                    date: speechData.date,
                    title: speechData.title,
                    speechLink: speechData.speechLink,
                    pdfLink: speechData.pdfLink,
                    pdfSize: speechData.pdfSize,
                });

                // If speech does not exist, return the data
                return !speech ? speechData : null;
            });

            // Wait for all promises to resolve and filter out null values
            const pdfs = (await Promise.all(pdfPromises)).filter(Boolean);

            if (pdfs.length > 0) {
                await Speech.insertMany(pdfs);
                console.log(`Data for ${year} saved!`);
            } else {
                console.log(`No data found for ${year}`);
            }

            totalNewData += pdfs.length;
        }

        res.json({ message: "Scraping and saving data completed!", totalNewData });
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred while scraping.");
    } finally {
        await browser.close();
    }
};
