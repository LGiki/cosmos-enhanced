const isValidXiaoyuzhouEpisodeUrl = (url) => {
    return /^https?:\/\/(?:www\.)?xiaoyuzhoufm.com\/episode\/([0-9a-zA-Z]{24})/.test(url);
};

const isValidXiaoyuzhouPodcastUrl = (url) => {
    return /^https?:\/\/(?:www\.)?xiaoyuzhoufm.com\/podcast\/([0-9a-zA-Z]{24})/.test(url);
};

const getPodcastName = () => {
    // If current page is podcast page, use meta title directly
    if (isValidXiaoyuzhouPodcastUrl(window.location.href)) {
        const meta = document.querySelector('meta[property="og:title"]');
        if (meta) {
            return meta.content;
        }
    }
    const nameElement = document.querySelector('.podcast-title .name');
    if (nameElement) {
        return nameElement.innerText;
    }
    // If no name element, try the co-podcast-title element
    const coNameElement = document.querySelector('.co-podcast-title .names');
    return coNameElement ? coNameElement.innerText : null;
};

const getEpisodeName = () => {
    // If current page is episode page, use meta title directly
    if (isValidXiaoyuzhouEpisodeUrl(window.location.href)) {
        const meta = document.querySelector('meta[property="og:title"]');
        if (meta) {
            return meta.content;
        }
    }
    const titleElement = document.querySelector('h1.title');
    return titleElement ? titleElement.innerText : null;
};

const stripInvalidFilename = (filename) => {
    if (!filename) {
        return null;
    }
    return filename.replace(/[/\\?%*:|"<>]/g, '');
};

const parseUrl = (url) => {
    if (!url) {
        return null;
    }
    try {
        return new URL(url, window.location.href);
    } catch {
        return null;
    }
};

const getAudioFilename = (audioFileUrl) => {
    const supportFileExtensions = [
        '.mp3',
        '.m4a',
        '.wav',
        '.ogg',
        '.flac',
        '.ape',
        '.aac',
        '.aiff',
        '.wma',
        '.webm',
    ];
    const parsedAudioUrl = parseUrl(audioFileUrl);
    if (!parsedAudioUrl) {
        return null;
    }
    const pathname = parsedAudioUrl.pathname.toLowerCase();
    const audioFileExtension = supportFileExtensions.find((extension) =>
        pathname.endsWith(extension),
    );
    if (!audioFileExtension) {
        return null;
    }
    const episodeName = getEpisodeName();
    const podcastName = getPodcastName();
    if (!episodeName || !podcastName) {
        return null;
    }
    return `${episodeName} - ${podcastName}${audioFileExtension}`;
};

const getImageFileExtension = (coverImageUrl) => {
    const supportFileExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.psd',
        '.svg',
        '.tiff',
        '.bmp',
        '.heif',
    ];
    const parsedCoverImageUrl = parseUrl(coverImageUrl);
    if (!parsedCoverImageUrl) {
        return '.jpg';
    }
    const pathname = parsedCoverImageUrl.pathname.toLowerCase();
    const coverImageExtension = supportFileExtensions.find((extension) =>
        pathname.endsWith(extension),
    );
    if (coverImageExtension) {
        return coverImageExtension;
    }
    return '.jpg';
};

const getFullImageUrl = (coverImageUrl) => {
    const url = parseUrl(coverImageUrl);
    if (!url) {
        return null;
    }
    const imageSuffix = ['@small', '@middle', '@large'];
    const matchedSuffix = imageSuffix.find((suffix) => url.pathname.endsWith(suffix));
    if (!matchedSuffix) {
        return url.href;
    }
    url.pathname = url.pathname.slice(0, url.pathname.lastIndexOf(matchedSuffix));
    return url.href;
};

const getListenNotesSearchUrl = (keyword) => {
    return `https://www.listennotes.com/search/?q=${encodeURIComponent(keyword)}`;
};

const sendMessage = (message) => {
    chrome.runtime.sendMessage(message).catch(console.error);
};

let playbackRateAbortController = null;

const generatePlaybackRateController = () => {
    if (playbackRateAbortController) {
        playbackRateAbortController.abort();
    }
    playbackRateAbortController = new AbortController();
    const { signal } = playbackRateAbortController;

    const audioElement = document.querySelector('audio');
    if (!audioElement) {
        return;
    }
    const controlContainer = audioElement.previousElementSibling;
    if (!controlContainer) {
        return;
    }

    const playbackRateController = document.createElement('div');
    playbackRateController.id = 'playback-rate-controller';

    const adjustRate = (delta) => {
        const newRate = Math.round((audioElement.playbackRate + delta) * 10) / 10;
        if (newRate >= 0.1 && newRate <= 16.0) {
            audioElement.playbackRate = newRate;
        }
    };

    const playbackRateMinusButton = document.createElement('button');
    playbackRateMinusButton.textContent = '-';
    playbackRateMinusButton.onclick = () => adjustRate(-0.1);

    const playbackRateDisplay = document.createElement('div');
    const playbackRateValue = audioElement.playbackRate;
    playbackRateDisplay.textContent = `${playbackRateValue.toFixed(1)}x`;
    playbackRateDisplay.id = 'playback-rate';
    playbackRateDisplay.title = '双击重置播放速度，鼠标滚轮可快速调整播放速度';

    audioElement.addEventListener(
        'ratechange',
        () => {
            playbackRateDisplay.textContent = `${audioElement.playbackRate.toFixed(1)}x`;
        },
        { signal },
    );
    playbackRateDisplay.addEventListener(
        'dblclick',
        () => {
            audioElement.playbackRate = 1.0;
        },
        { signal },
    );
    playbackRateDisplay.addEventListener(
        'wheel',
        (event) => {
            event.preventDefault();
            adjustRate(event.deltaY < 0 ? 0.1 : -0.1);
        },
        { passive: false, signal },
    );

    const playbackRatePlusButton = document.createElement('button');
    playbackRatePlusButton.textContent = '+';
    playbackRatePlusButton.onclick = () => adjustRate(0.1);

    playbackRateController.appendChild(playbackRateMinusButton);
    playbackRateController.appendChild(playbackRateDisplay);
    playbackRateController.appendChild(playbackRatePlusButton);

    controlContainer.appendChild(playbackRateController);
};

const appendButtonContent = (element, emoji, text) => {
    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'emoji';
    emojiSpan.textContent = emoji;
    element.appendChild(emojiSpan);
    element.append('\u00A0' + text);
};

const generateButton = (emoji, text, onClick) => {
    const button = document.createElement('button');
    button.className = 'cosmos-button';
    appendButtonContent(button, emoji, text);
    button.onclick = onClick;
    return button;
};

const generateDropdownButton = (emoji, text, menuItems) => {
    const dropdown = document.createElement('details');
    dropdown.className = 'cosmos-dropdown';

    const dropdownButton = document.createElement('summary');
    dropdownButton.className = 'cosmos-button';
    appendButtonContent(dropdownButton, emoji, text);
    dropdown.appendChild(dropdownButton);

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'cosmos-dropdown-menu';
    for (const { text: menuItemText, onClick } of menuItems) {
        const menuItem = document.createElement('button');
        menuItem.type = 'button';
        menuItem.className = 'cosmos-dropdown-item';
        menuItem.textContent = menuItemText;
        menuItem.onclick = () => {
            onClick();
            dropdown.removeAttribute('open');
        };
        dropdownMenu.appendChild(menuItem);
    }
    dropdown.appendChild(dropdownMenu);

    dropdown.addEventListener('toggle', () => {
        if (!dropdown.open) {
            return;
        }
        for (const otherDropdown of document.querySelectorAll('.cosmos-dropdown[open]')) {
            if (otherDropdown !== dropdown) {
                otherDropdown.removeAttribute('open');
            }
        }
    });

    return dropdown;
};

const getCoPodcastInfoList = () => {
    const coPodcastNameElements = document.querySelectorAll(
        '.co-podcast-title .names a, .co-podcast-title .name',
    );
    return Array.from(document.querySelectorAll('.co-podcast-image')).map(
        (avatarElement, index) => {
            const linkedElement = avatarElement.closest('a');
            const podcastName =
                avatarElement.alt?.trim() ||
                avatarElement.getAttribute('aria-label')?.trim() ||
                linkedElement?.getAttribute('aria-label')?.trim() ||
                linkedElement?.title?.trim() ||
                linkedElement?.innerText?.trim() ||
                coPodcastNameElements[index]?.innerText?.trim() ||
                `播客 ${index + 1}`;
            return { avatarElement, podcastName };
        },
    );
};

document.addEventListener('click', (event) => {
    for (const dropdown of document.querySelectorAll('.cosmos-dropdown[open]')) {
        if (!dropdown.contains(event.target)) {
            dropdown.removeAttribute('open');
        }
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
        return;
    }
    const dropdown = document.querySelector('.cosmos-dropdown[open]');
    if (dropdown) {
        dropdown.removeAttribute('open');
        dropdown.querySelector('summary')?.focus();
    }
});

const generateDownloadAudioButton = (container) => {
    const audioElement = document.querySelector('audio');
    if (!audioElement) {
        return;
    }
    const audioUrl = audioElement.src;
    const audioFilename = getAudioFilename(audioUrl);
    if (!audioFilename) {
        return;
    }
    const downloadButton = generateButton('🎵', '下载单集音频', () => {
        sendMessage({
            action: 'download',
            data: {
                url: audioUrl,
                filename: stripInvalidFilename(audioFilename),
            },
        });
    });
    container.appendChild(downloadButton);
};

const getEpisodeCoverImageUrl = () => {
    const avatarElement = document.querySelector('header .avatar, header .episode-image');
    return avatarElement ? getFullImageUrl(avatarElement.src) : null;
};

const generateDownloadEpisodeCoverButton = (container) => {
    const coverImageUrl = getEpisodeCoverImageUrl();
    if (!coverImageUrl) {
        return;
    }
    const extensionName = getImageFileExtension(coverImageUrl);
    const episodeName = getEpisodeName();
    const podcastName = getPodcastName();
    if (!episodeName || !podcastName) {
        return;
    }
    const filename = `${episodeName} - ${podcastName}${extensionName}`;
    const downloadButton = generateButton('🖼', '下载单集封面', () => {
        sendMessage({
            action: 'download',
            data: {
                url: coverImageUrl,
                filename: stripInvalidFilename(filename),
            },
        });
    });
    container.appendChild(downloadButton);
};

const generateDownloadPodcastCoverButton = (container) => {
    const createDownloadTask = (avatarElement, podcastName) => {
        const coverImageUrl = getFullImageUrl(avatarElement.src);
        if (!coverImageUrl || !podcastName) {
            return null;
        }
        const extensionName = getImageFileExtension(coverImageUrl);
        return {
            url: coverImageUrl,
            filename: stripInvalidFilename(`${podcastName}${extensionName}`),
            podcastName,
        };
    };

    const downloadCover = (downloadTask) => {
        sendMessage({
            action: 'download',
            data: {
                url: downloadTask.url,
                filename: downloadTask.filename,
            },
        });
    };

    if (isValidXiaoyuzhouEpisodeUrl(window.location.href)) {
        const coPodcastInfoList = getCoPodcastInfoList();
        if (coPodcastInfoList.length > 1) {
            const downloadTaskList = coPodcastInfoList
                .map(({ avatarElement, podcastName }) =>
                    createDownloadTask(avatarElement, podcastName),
                )
                .filter(Boolean);

            if (downloadTaskList.length === 0) {
                return;
            }

            const dropdown = generateDropdownButton(
                '🖼',
                '下载播客封面',
                downloadTaskList.map((downloadTask) => ({
                    text: downloadTask.podcastName,
                    onClick: () => downloadCover(downloadTask),
                })),
            );
            container.appendChild(dropdown);
            return;
        }
    }

    let avatarElement = null;
    if (isValidXiaoyuzhouEpisodeUrl(window.location.href)) {
        avatarElement = document.querySelector('.co-podcast-image, header .side-avatar');
    } else if (isValidXiaoyuzhouPodcastUrl(window.location.href)) {
        avatarElement = document.querySelector('.avatar');
    }
    if (!avatarElement) {
        return;
    }
    const podcastName = avatarElement.alt?.trim() || getPodcastName();
    const downloadTask = createDownloadTask(avatarElement, podcastName);
    if (!downloadTask) {
        return;
    }
    const downloadButton = generateButton('🖼', '下载播客封面', () => {
        downloadCover(downloadTask);
    });
    container.appendChild(downloadButton);
};

const generateDownloadPodcasterAvatarButton = (container) => {
    const avatarElements = document.querySelectorAll('.avatar-container img');
    const podcastName = getPodcastName();
    if (!podcastName) {
        return;
    }
    const downloadTaskList = [];
    for (const avatarElement of avatarElements) {
        const avatarUrl = getFullImageUrl(avatarElement.src);
        if (!avatarUrl) {
            continue;
        }
        const extensionName = getImageFileExtension(avatarUrl);
        const podcasterName = avatarElement.alt;
        const filename = `${podcastName} - ${podcasterName}${extensionName}`;
        downloadTaskList.push({
            url: avatarUrl,
            filename: stripInvalidFilename(filename),
        });
    }
    if (downloadTaskList.length > 0) {
        const downloadButton = generateButton('🖼', '下载主播头像', () => {
            for (const downloadTask of downloadTaskList) {
                sendMessage({
                    action: 'download',
                    data: downloadTask,
                });
            }
        });
        container.appendChild(downloadButton);
    }
};

const generateSearchPodcastButton = (container) => {
    const searchPodcast = (podcastName) => {
        sendMessage({
            action: 'openNewTab',
            data: {
                url: getListenNotesSearchUrl(podcastName),
            },
        });
    };

    if (isValidXiaoyuzhouEpisodeUrl(window.location.href)) {
        const coPodcastInfoList = getCoPodcastInfoList();
        if (coPodcastInfoList.length > 1) {
            const dropdown = generateDropdownButton(
                '🔍',
                '在\u00A0ListenNotes\u00A0搜索播客',
                coPodcastInfoList.map(({ podcastName }) => ({
                    text: podcastName,
                    onClick: () => searchPodcast(podcastName),
                })),
            );
            container.appendChild(dropdown);
            return;
        }
    }

    const podcastName = getPodcastName();
    if (podcastName) {
        const searchButton = generateButton('🔍', '在\u00A0ListenNotes\u00A0搜索播客', () => {
            searchPodcast(podcastName);
        });
        container.appendChild(searchButton);
    }
};

const generateSearchEpisodeButton = (container) => {
    const episodeName = getEpisodeName();
    if (episodeName) {
        const searchButton = generateButton('🔍', '在\u00A0ListenNotes\u00A0搜索单集', () => {
            sendMessage({
                action: 'openNewTab',
                data: {
                    url: getListenNotesSearchUrl(episodeName),
                },
            });
        });
        container.appendChild(searchButton);
    }
};

const enhanceEpisodePage = () => {
    const cosmosEnhancedContainer = document.createElement('div');
    cosmosEnhancedContainer.className = 'cosmos-enhanced-container';

    const downloadButtonsContainer = document.createElement('div');
    downloadButtonsContainer.className = 'cosmos-enhanced-buttons-container';
    generateDownloadAudioButton(downloadButtonsContainer);
    generateDownloadEpisodeCoverButton(downloadButtonsContainer);
    generateDownloadPodcastCoverButton(downloadButtonsContainer);
    cosmosEnhancedContainer.appendChild(downloadButtonsContainer);

    const searchButtonsContainer = document.createElement('div');
    searchButtonsContainer.className = 'cosmos-enhanced-buttons-container';
    generateSearchPodcastButton(searchButtonsContainer);
    generateSearchEpisodeButton(searchButtonsContainer);
    cosmosEnhancedContainer.appendChild(searchButtonsContainer);

    const header = document.querySelector('header');
    if (!header || !header.parentNode) {
        return;
    }
    header.parentNode.insertBefore(cosmosEnhancedContainer, header.nextSibling);
};

const enhancePodcastPage = () => {
    const cosmosEnhancedContainer = document.createElement('div');
    cosmosEnhancedContainer.className = 'cosmos-enhanced-container';

    const downloadButtonsContainer = document.createElement('div');
    downloadButtonsContainer.className = 'cosmos-enhanced-buttons-container';
    generateDownloadPodcastCoverButton(downloadButtonsContainer);
    generateDownloadPodcasterAvatarButton(downloadButtonsContainer);
    cosmosEnhancedContainer.appendChild(downloadButtonsContainer);

    const searchButtonsContainer = document.createElement('div');
    searchButtonsContainer.className = 'cosmos-enhanced-buttons-container';
    generateSearchPodcastButton(searchButtonsContainer);
    cosmosEnhancedContainer.appendChild(searchButtonsContainer);

    const podcasters = document.querySelector('main .podcasters');
    if (!podcasters || !podcasters.parentNode) {
        return;
    }
    podcasters.parentNode.insertBefore(cosmosEnhancedContainer, podcasters.nextSibling);
};

const refreshEnhancements = () => {
    const cosmosEnhancedContainer = document.querySelector('.cosmos-enhanced-container');
    if (cosmosEnhancedContainer) {
        cosmosEnhancedContainer.remove();
    }
    const playbackRateController = document.querySelector('#playback-rate-controller');
    if (playbackRateController) {
        playbackRateController.remove();
    }
    if (isValidXiaoyuzhouPodcastUrl(window.location.href)) {
        enhancePodcastPage();
    } else if (isValidXiaoyuzhouEpisodeUrl(window.location.href)) {
        enhanceEpisodePage();
    }
    generatePlaybackRateController();
};

const callback = (mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            refreshEnhancements();
            return;
        }
    }
};

const observedContainer = document.querySelector('title');
if (observedContainer) {
    const observer = new MutationObserver(callback);
    observer.observe(observedContainer, { attributes: true, childList: true, subtree: true });
}

window.addEventListener('load', () => {
    if (isValidXiaoyuzhouEpisodeUrl(window.location.href)) {
        enhanceEpisodePage();
    } else if (isValidXiaoyuzhouPodcastUrl(window.location.href)) {
        enhancePodcastPage();
    }
    generatePlaybackRateController();
});
