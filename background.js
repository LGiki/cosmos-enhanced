chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action, data } = message;
    switch (action) {
        case 'download':
            const { url, filename } = data;
            chrome.downloads.download({
                url: url,
                filename: filename,
            });
            break;
        case 'openNewTab':
            const { url: newTabUrl } = data;
            chrome.tabs.create({
                url: newTabUrl,
            });
            break;
        default:
            break;
    }
});
