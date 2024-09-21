import { Dataset, createPlaywrightRouter } from "crawlee";

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    await enqueueLinks({
        globs: ["https://www.warbyparker.com/*", "https://warbyparker.com/*"],
        label: "detail",
    });
});

router.addHandler("detail", async ({ request, page, log }) => {
    // Wait for the body to ensure the page is loaded
    await page.waitForSelector("body");

    // Select the button based on its text content
    // const modelBtn = await page.$('span:contains("Try on virtually")');
    const modelBtn = page.getByText("Try on virtually").first();

    const pageTitle = await page.title(); // Get page title


    log.info(`URL: ${request?.url}, ${pageTitle}`);

    if (modelBtn) {
        log.info(`modelBtn exists: ${!!modelBtn}`);
        const scriptTag = await page.$('script[type="application/ld+json"][data-testid="application-ld-json"]');
        if (!scriptTag) return;
        const scriptContent = await scriptTag.textContent();
        const jsonData = JSON.parse(scriptContent as string) as unknown as Record<string, any>;

        const matchingItem = jsonData?.itemListElement?.find?.((item: Record<string, any>) => item.item['@id'].includes('https://www.warbyparker.com/frames/pdp')
        );

        if (!matchingItem) return;

        const extractedSlug = matchingItem.item['@id'].split('/').pop();

        const modelUrl = `https://www-next-vto.warbyparker.com/${extractedSlug}_medium.glb`;


        log.info('Data found', {
            modelUrl: modelUrl || null,
            productUrl: request?.url,
            pageTitle,
            keywords: null,
            title: pageTitle,
        });
        const dataset = await Dataset.open("wark");

        await dataset.pushData({
            modelUrl: modelUrl || null,
            productUrl: request?.url,
            pageTitle,
            keywords: null,
            title: pageTitle,
        });
    }
});
