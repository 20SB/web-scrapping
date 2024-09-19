require("dotenv").config();

const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const cron = require("node-cron");
const Speech = require("./models/Speech");
const connectToDB = require("./config/mongoConfig.js");
const ScrappingLog = require("./models/ScrappingLog.js");

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeRbiSpeeches() {
    const url = "https://www.rbi.org.in";
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        defaultViewport: null,
    });
    const page = await browser.newPage();

    try {
        const allSpeeches = await Speech.find({});
        const speechMap = new Map();
        allSpeeches.forEach((speech) => {
            const key = `${speech.date}-${speech.title}-${speech.speechLink}-${speech.pdfLink}`;
            speechMap.set(key, true);
        });

        await page.goto(url, { waitUntil: "networkidle2" });

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
            return (
                Array.from(listItems).find((item) => item.innerText.trim() === "Speeches") || null
            );
        }, siblingElement);

        await speechesItem.click();
        await page.waitForNavigation({ waitUntil: "load" });

        const currentYear = new Date().getFullYear();

        let totalNewData = 0;
        let totalscrapedData = 0;

        for (let year = currentYear; year >= 1990; year--) {
            await delay(2000);
            await page.evaluate((year) => {
                const element = document.getElementById(`${year}0`);
                if (element) element.click();
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
                    if (dateHeader) currentDate = dateHeader.textContent.trim();

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

            totalscrapedData += scrapedData.length;
            const newSpeeches = scrapedData.filter((speechData) => {
                const key = `${speechData.date}-${speechData.title}-${speechData.speechLink}-${speechData.pdfLink}`;
                return !speechMap.has(key);
            });

            if (newSpeeches.length > 0) {
                await Speech.insertMany(newSpeeches);
                console.log(`Data for ${year} saved!`);
                totalNewData += newSpeeches.length;
            } else {
                console.log(`No new data found for ${year}`);
            }

            console.log(`scrapedData for ${year}= ${scrapedData.length}`);
        }

        await ScrappingLog.create({
            totalscrapedData: totalscrapedData,
            totalNewData: totalNewData,
        });

        console.log(
            `Scraping completed. Scrapped Item: ${totalscrapedData}. Total new speeches: ${totalNewData}`
        );
    } catch (error) {
        console.error("An error occurred during scraping:", error);
    } finally {
        await browser.close();
    }
}

cron.schedule("*/5 * * * *", async () => {
    console.log("Starting the scheduled scraping job...");
    await connectToDB();
    await scrapeRbiSpeeches();
    mongoose.connection.close();
    console.log("Scraping job completed.");
});

if (require.main === module) {
    (async () => {
        await connectToDB();
        await scrapeRbiSpeeches();
        mongoose.connection.close();
    })();
}
