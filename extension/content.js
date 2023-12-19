const BASE_URL = "";

/** @returns {Promise<HTMLElement>} */
function tryQuerySelect(selector, maxTries = 10) {
    return new Promise((resolve, reject) => {
        let tries = 0;

        setInterval(() => {
            const element = document.querySelector(selector);
            tries++;

            if (element) {
                resolve(element);
            }

            if (tries > maxTries) {
                reject("Could not find element");
            }
        }, 1000);
    });
}

/** @returns {Promise<HTMLElement[]>} */
function tryQuerySelectAll(selector, maxTries = 10) {
    return new Promise((resolve, reject) => {
        let tries = 0;

        setInterval(() => {
            const element = document.querySelectorAll(selector);
            tries++;

            if (element) {
                resolve(element);
            }

            if (tries > maxTries) {
                reject("Could not find element");
            }
        }, 1000);
    });
}

function normalDownloadButton() {
    const download_button = document.createElement("button");
    download_button.innerHTML = "Download";
    download_button.className = "yt-dlp-download-button"
    download_button.style = `
        background-color: #2f2f2f;
        border: none;
        color: white;
        border-radius: 18px;
        text-align: center;
        text-decoration: none;
        font-size: 14px;
        font-family: Roboto, Arial, sans-serif;
        font-weight: 500;
        margin-right: 8px;
        width: 100px;
        text-wrap: nowrap;
        overflow: hidden;
        cursor: pointer;
    `;

    download_button.addEventListener("mouseover", function () {
        download_button.animate(
            [
                {
                    backgroundColor: "#2f2f2f",
                },
                {
                    backgroundColor: "#4f4f4f",
                },
            ],
            {
                duration: 200,
                fill: "forwards",
                easing: "ease-in-out",
            }
        );
    });

    download_button.addEventListener("mouseout", function () {
        download_button.animate(
            [
                {
                    backgroundColor: "#4f4f4f",
                },
                {
                    backgroundColor: "#2f2f2f",
                },
            ],
            {
                duration: 200,
                fill: "forwards",
                easing: "ease-in-out",
            }
        );
    });

    download_button.addEventListener("click", async function () {
        window.location.href = `${BASE_URL}/download?url=${window.location.href}`;
    });

    return download_button;
}

function shortsDownloadButton() {
    const download_button = normalDownloadButton();
    download_button.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" style="pointer-events: none; display: block; width: 75%; height: 75%;"><path d="M17 18v1H6v-1h11zm-.5-6.6-.7-.7-3.8 3.7V4h-1v10.4l-3.8-3.8-.7.7 5 5 5-4.9z"></path></svg>';
    // text is centered vertically and horizontally
    download_button.style = `
        background-color: #2f2f2f;
        border: none;
        color: white;
        border-radius: 50%;
        text-align: center;
        text-decoration: none;
        font-size: 14px;
        font-family: Roboto, Arial, sans-serif;
        font-weight: 500;
        width: 50px;
        aspect-ratio: 1;
        text-wrap: nowrap;
        overflow: hidden;
        cursor: pointer;
        fill: currentColor;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    return download_button;
}

async function onVideo() {
    const url = window.location.href;

    if (url.includes("watch")) {
        onWatch();
    }

    if (url.includes("shorts")) {
        onShorts();
    }
}

async function onWatch() {
    const node = await tryQuerySelect("#title.ytd-watch-metadata yt-formatted-string");

    node.parentNode.insertBefore(normalDownloadButton(title), node);
}

async function onShorts() {
    const nodes = await tryQuerySelectAll("#actions");

    for (const node of nodes) {
        if (node.clientHeight === 0 || node.querySelector(".yt-dlp-download-button")) {
            continue;
        }
        node.insertBefore(shortsDownloadButton(), node.firstElementChild);
    }
}

window.addEventListener("load", onVideo);
window.addEventListener("popstate", onVideo);

(async function () {
    if (!location.pathname.startsWith("/shorts")) {
        return;
    }

    const observer = new MutationObserver(onShorts);

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
})()