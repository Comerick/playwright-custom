import { Dataset, createPlaywrightRouter } from 'crawlee';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ enqueueLinks, log  }) => {
    log.info(`enqueueing new URLs`);
    await enqueueLinks({
        globs: ['https://www.warbyparker.com/*', 'https://warbyparker.com/*'],
        label: 'detail',
    });
});

router.addHandler('detail', async ({ request, page, log }) => {

    // Wait for the body to ensure the page is loaded
    await page.waitForSelector('body');

    // Select the button based on its text content
    // const modelBtn = await page.$('span:contains("Try on virtually")');
    const modelBtn = page.getByText('Try on virtually').first();

    const pageTitle = await page.title(); // Get page title

    log.info(`URL: ${request?.url}, ${pageTitle}`);

    if (modelBtn) {
        log.info(`modelBtn exists: ${!!modelBtn}`);

        // Intercept network requests and click the button
        const [modelRequest] = await Promise.all([
            page.waitForRequest(request => {
                log.info(`Request url:${request.url()}`)
                return /\.glb$/.test(request.url())
            }, { timeout: 30000 }),
            modelBtn.click()
        ]);

        await Dataset.pushData({
            modelUrl: modelRequest?.url || null,
            productUrl: request?.url,
            pageTitle,
            keywords: null,
            title: pageTitle
        });
    }
});
