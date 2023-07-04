const isValidXiaoyuzhouEpisodeUrl = (url) => {
    return /^https?:\/\/(?:www\.)?xiaoyuzhoufm.com\/episode\/([0-9a-zA-Z]{24})$/.test(url);
};

const isValidXiaoyuzhouPodcastUrl = (url) => {
    return /^https?:\/\/(?:www\.)?xiaoyuzhoufm.com\/podcast\/([0-9a-zA-Z]{24})$/.test(url);
};

const getPodcastName = () => {
    if (isValidXiaoyuzhouPodcastUrl(window.location.href)) {
        return document.querySelector('meta[property="og:title"]').content;
    }
    return document.querySelector('.podcast-title .name').innerText;
};

const getEpisodeName = () => {
    if (isValidXiaoyuzhouEpisodeUrl(window.location.href)) {
        return document.querySelector('meta[property="og:title"]').content;
    }
    return null;
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
    const audioFileExtension = supportFileExtensions.find((extension) =>
        audioFileUrl.toLowerCase().endsWith(extension),
    );
    if (!audioFileExtension) {
        return null;
    }
    const episodeName = getEpisodeName();
    const podcastName = getPodcastName();
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
    const coverImageExtension = supportFileExtensions.find((extension) =>
        coverImageUrl.toLowerCase().endsWith(extension),
    );
    if (coverImageExtension) {
        return coverImageExtension;
    }
    return '.jpg';
};

const getFullImageUrl = (coverImageUrl) => {
    const imageSuffix = ['@small', '@middle', '@large'];
    const imageSuffixIndex = imageSuffix.findIndex((suffix) => coverImageUrl.endsWith(suffix));
    if (imageSuffixIndex === -1) {
        return coverImageUrl;
    }
    return coverImageUrl.slice(0, coverImageUrl.lastIndexOf(imageSuffix[imageSuffixIndex]));
};

const getListenNotesSearchUrl = (keyword) => {
    return `https://www.listennotes.com/search/?q=${keyword}`;
};

const generatePlaybackRateController = () => {
    const controlContainer = document.querySelector('.controls');
    const audioElement = document.querySelector('audio');

    if (controlContainer && audioElement) {
        audioElement.addEventListener('ratechange', () => {
            const playbackRateValue = audioElement.playbackRate;
            console.log(`playbackRate: ${playbackRateValue.toFixed(1)}`);
            playbackRate.innerHTML = `${playbackRateValue.toFixed(1)}x`;
        });

        const playbackRateController = document.createElement('div');
        playbackRateController.id = 'playback-rate-controller';

        playbackRateMinusButton = document.createElement('button');
        playbackRateMinusButton.innerHTML = '-';
        playbackRateMinusButton.onclick = () => {
            if (audioElement.playbackRate <= 0.1) {
                return;
            }
            audioElement.playbackRate = (audioElement.playbackRate - 0.1).toFixed(1);
        };

        playbackRate = document.createElement('div');
        const playbackRateValue = audioElement.playbackRate;
        playbackRate.innerHTML = `${playbackRateValue.toFixed(1)}x`;
        playbackRate.id = 'playback-rate';
        playbackRate.title = '双击重置播放速度，滚轮调整播放速度';
        playbackRate.addEventListener('dblclick', () => {
            audioElement.playbackRate = 1.0;
        });
        playbackRate.addEventListener('wheel', (event) => {
            event.preventDefault();
            if (event.deltaY < 0) {
                if (audioElement.playbackRate >= 16.0) {
                    return;
                }
                audioElement.playbackRate = (audioElement.playbackRate + 0.1).toFixed(1);
            } else {
                if (audioElement.playbackRate <= 0.1) {
                    return;
                }
                audioElement.playbackRate = (audioElement.playbackRate - 0.1).toFixed(1);
            }
        });

        playbackRatePlusButton = document.createElement('button');
        playbackRatePlusButton.innerHTML = '+';
        playbackRatePlusButton.onclick = () => {
            if (audioElement.playbackRate >= 16.0) {
                return;
            }
            audioElement.playbackRate = (audioElement.playbackRate + 0.1).toFixed(1);
        };

        playbackRateController.appendChild(playbackRateMinusButton);
        playbackRateController.appendChild(playbackRate);
        playbackRateController.appendChild(playbackRatePlusButton);

        controlContainer.appendChild(playbackRateController);
    }
};

const generateButton = (text, onClick) => {
    const button = document.createElement('button');
    button.className = 'cosmos-button';
    button.innerHTML = text;
    button.title = text;
    button.ariaLabel = text;
    button.onclick = onClick;
    return button;
};

const generateDownloadAudioButton = (container) => {
    const audioElement = document.querySelector('audio');
    if (audioElement) {
        const audioUrl = audioElement.src;
        const audioFilename = getAudioFilename(audioUrl);
        const downloadButton = generateButton('🎵 下载单集音频', () => {
            chrome.runtime.sendMessage({
                action: 'download',
                data: {
                    url: audioUrl,
                    filename: audioFilename,
                },
            });
        });
        container.appendChild(downloadButton);
    }
};

const generateDownloadEpisodeCoverButton = (container) => {
    const avatarElement = document.querySelector('header .avatar');
    if (avatarElement) {
        let coverImageUrl = avatarElement.src;
        coverImageUrl = getFullImageUrl(coverImageUrl);
        const extensionName = getImageFileExtension(coverImageUrl);
        const episodeName = getEpisodeName();
        const podcastName = getPodcastName();
        const filename = `${episodeName} - ${podcastName}${extensionName}`;
        const downloadButton = generateButton('🖼 下载单集封面', () => {
            chrome.runtime.sendMessage({
                action: 'download',
                data: {
                    url: coverImageUrl,
                    filename: filename,
                },
            });
        });
        container.appendChild(downloadButton);
    }
};

const generateDownloadPodcastCoverButton = (container) => {
    let avatarElement = null;
    if (isValidXiaoyuzhouEpisodeUrl(window.location.href)) {
        avatarElement = document.querySelector('header .side-avatar');
    } else if (isValidXiaoyuzhouPodcastUrl(window.location.href)) {
        avatarElement = document.querySelector('.avatar');
    }
    if (avatarElement) {
        let coverImageUrl = avatarElement.src;
        coverImageUrl = getFullImageUrl(coverImageUrl);
        const extensionName = getImageFileExtension(coverImageUrl);
        const podcastName = getPodcastName();
        const filename = `${podcastName}${extensionName}`;
        const downloadButton = generateButton('🖼 下载播客封面', () => {
            chrome.runtime.sendMessage({
                action: 'download',
                data: {
                    url: coverImageUrl,
                    filename: filename,
                },
            });
        });
        container.appendChild(downloadButton);
    }
};

const generateDownloadPodcasterAvatarButton = (container) => {
    const avatarElements = document.querySelectorAll('.avatar-container img');
    const downloadTaskList = [];
    for (const avatarElement of avatarElements) {
        let avatarUrl = avatarElement.src;
        avatarUrl = getFullImageUrl(avatarUrl);
        const extensionName = getImageFileExtension(avatarUrl);
        const podcasterName = avatarElement.alt;
        const podcastName = getPodcastName();
        const filename = `${podcastName} - ${podcasterName}${extensionName}`;
        downloadTaskList.push({
            url: avatarUrl,
            filename: filename,
        });
    }
    if (downloadTaskList.length > 0) {
        const downloadButton = generateButton('🖼 下载主播头像', () => {
            for (const downloadTask of downloadTaskList) {
                chrome.runtime.sendMessage({
                    action: 'download',
                    data: downloadTask,
                });
            }
        });
        container.appendChild(downloadButton);
    }
};

const generateSearchPodcastButton = (container) => {
    const podcastName = getPodcastName();
    if (podcastName) {
        const searchButton = generateButton('🔍 在 ListenNotes 搜索播客', () => {
            chrome.runtime.sendMessage({
                action: 'openNewTab',
                data: {
                    url: getListenNotesSearchUrl(podcastName),
                },
            });
        });
        container.appendChild(searchButton);
    }
};

const generateSearchEpisodeButton = (container) => {
    const episodeName = getEpisodeName();
    if (episodeName) {
        const searchButton = generateButton('🔍 在 ListenNotes 搜索单集', () => {
            chrome.runtime.sendMessage({
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

    downloadButtonsContainer = document.createElement('div');
    downloadButtonsContainer.className = 'cosmos-enhanced-buttons-container';
    generateDownloadAudioButton(downloadButtonsContainer);
    generateDownloadEpisodeCoverButton(downloadButtonsContainer);
    generateDownloadPodcastCoverButton(downloadButtonsContainer);
    cosmosEnhancedContainer.appendChild(downloadButtonsContainer);

    searchButtonsContainer = document.createElement('div');
    searchButtonsContainer.className = 'cosmos-enhanced-buttons-container';
    generateSearchPodcastButton(searchButtonsContainer);
    generateSearchEpisodeButton(searchButtonsContainer);
    cosmosEnhancedContainer.appendChild(searchButtonsContainer);

    const header = document.querySelector('header');
    header.parentNode.insertBefore(cosmosEnhancedContainer, header.nextSibling);
};

const enhancePodcastPage = () => {
    const cosmosEnhancedContainer = document.createElement('div');
    cosmosEnhancedContainer.className = 'cosmos-enhanced-container';

    downloadButtonsContainer = document.createElement('div');
    downloadButtonsContainer.className = 'cosmos-enhanced-buttons-container';
    generateDownloadPodcastCoverButton(downloadButtonsContainer);
    generateDownloadPodcasterAvatarButton(downloadButtonsContainer);
    cosmosEnhancedContainer.appendChild(downloadButtonsContainer);

    searchButtonsContainer = document.createElement('div');
    searchButtonsContainer.className = 'cosmos-enhanced-buttons-container';
    generateSearchPodcastButton(searchButtonsContainer);
    cosmosEnhancedContainer.appendChild(searchButtonsContainer);

    const podcasters = document.querySelector('main .podcasters');
    podcasters.parentNode.insertBefore(cosmosEnhancedContainer, podcasters.nextSibling);
};

const callback = (mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const cosmosEnhancedContainer = document.querySelector('.cosmos-enhanced-container');
            const playbackRateController = document.querySelector('#playback-rate-controller');
            cosmosEnhancedContainer.remove();
            if (isValidXiaoyuzhouPodcastUrl(window.location.href)) {
                enhancePodcastPage();
            } else if (isValidXiaoyuzhouEpisodeUrl(window.location.href)) {
                enhanceEpisodePage();
            }
            if (!playbackRateController) {
                generatePlaybackRateController();
            }
        }
    }
};

const observedContainer = document.querySelector('title');
const observer = new MutationObserver(callback);
observer.observe(observedContainer, { attributes: true, childList: true, subtree: true });

window.onload = () => {
    if (isValidXiaoyuzhouEpisodeUrl(window.location.href)) {
        enhanceEpisodePage();
    } else if (isValidXiaoyuzhouPodcastUrl(window.location.href)) {
        enhancePodcastPage();
    }
    const playbackRateController = document.querySelector('#playback-rate-controller');
    if (!playbackRateController) {
        generatePlaybackRateController();
    }
};
