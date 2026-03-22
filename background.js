const isValidUrl = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action, data } = message;
    switch (action) {
        case 'download': {
            const { url, filename } = data;
            if (!isValidUrl(url)) {
                break;
            }
            chrome.downloads.download({
                url: url,
                filename: filename,
            });
            break;
        }
        case 'openNewTab': {
            const { url: newTabUrl } = data;
            if (!isValidUrl(newTabUrl)) {
                break;
            }
            chrome.tabs.create({
                url: newTabUrl,
            });
            break;
        }
        default:
            break;
    }
});
