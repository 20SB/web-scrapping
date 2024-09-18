const { default: puppeteer } = require("puppeteer");

const dataextraction = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        channel: "chrome",
    });
    const data = [];

    const page = await browser.newPage();
    await page.goto("https://m.rbi.org.in//Scripts/BS_ViewSpeeches.aspx", {
        waitUntil: "networkidle2",
    });

    await page.waitForSelector(".accordionButton.year");

    const extractyears = await page.evaluate(() => {
        const elements = document.querySelectorAll(".accordionButton.year");
        return Array.from(elements).map((element) => element.innerText);
    });

    for (const year of extractyears) {
        const monthText = await page.evaluate(async (year) => {
            const dropdownlink = document.querySelector(`[id = "${year}0"]`);
            if (dropdownlink) {
                dropdownlink.click();
                return dropdownlink.innerText;
            } else {
                return null;
            }
        }, year);

        await page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {});

        const hrefs = await page.evaluate(async (year) => {
            // const img = document.querySelector(img[(alt = "Red dot")]);
            // console.log(img);
            const yearButton = document.querySelector(`[id = "btn${year}"]`);
            if (yearButton) {
                yearButton.click();
                const anchors = document.querySelectorAll("a");
                const pdfArrayLinks = Array.from(anchors)
                    .map((anchor) => anchor.href)
                    .filter((href) => href.toLowerCase().endsWith(".pdf"));
                return { year, pdfArrayLinks };
            } else {
                return { year, pdfArrayLinks: [] };
            }
        }, year);

        data.push(hrefs);
        // console.log(hrefs);
    }
    // console.log("data ", data);
    // const jsonData = JSON.stringify(data, null, 2);

    // fs.writeFile("./extract/rbi.json", jsonData, (err) => {
    //     if (err) {
    //         console.error("Error writing to file", err);
    //     } else {
    //         console.log("Successfully written data to products.json");
    //     }
    // });
    console.log(data);

    await browser.close();
};

dataextraction();
