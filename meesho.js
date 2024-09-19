const puppeteer = require("puppeteer");
const fs = require("fs");

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeMeesho() {
    const url = "https://www.meesho.com/bags-ladies/pl/3jo";
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });
    const page = await browser.newPage();

    let allResponseData = []; // To store all response data

    try {
        // Listen for console messages from the browser
        page.on("console", (msg) => {
            console.log("PAGE LOG:", msg.text());
        });

        // Intercept and modify requests
        await page.setRequestInterception(true);
        console.log("Ready for interception");

        page.on("request", (request) => {
            if (request.url() === "https://www.meesho.com/api/v1/products") {
                try {
                    console.log("Intercepting request to modify payload");

                    // Parse the existing payload
                    let postData = JSON.parse(request.postData());

                    // Modify the payload as needed
                    postData.limit = 1000; // Increase limit to fetch more data

                    // Continue with the modified payload
                    request.continue({
                        method: "POST",
                        postData: JSON.stringify(postData),
                        headers: {
                            ...request.headers(),
                            "Content-Type": "application/json",
                        },
                    });
                } catch (error) {
                    console.error("Error parsing request payload:", error);
                    request.continue();
                }
            } else {
                request.continue();
            }
        });

        console.log("Request interception set, waiting for response");

        // Listen for the response
        page.on("response", async (response) => {
            if (response.url() === "https://www.meesho.com/api/v1/products") {
                try {
                    console.log("Received response from products API");

                    const responseData = await response.json();
                    // console.log("Response Data:", responseData);

                    // Store the response data
                    allResponseData.push(responseData);

                    // Save the response data to a JSON file
                    fs.writeFileSync("data.json", JSON.stringify(allResponseData, null, 2));
                    console.log("Data has been saved to data.json");
                } catch (error) {
                    console.error("Error parsing response data:", error);
                }
            }
        });

        console.log("Navigating to the target URL");

        // Navigate to the page that triggers the API request
        await page.goto(url, { waitUntil: "networkidle0" });

        // Wait for the specific network request to be triggered and handled
        await delay(10000); // Wait for some time to ensure all requests are completed
    } catch (error) {
        console.error("An error occurred during scraping:", error);
    } finally {
        await browser.close();
    }
}

scrapeMeesho();
