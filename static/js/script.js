const AI_SETTINGS_KEY = "accessibleOcrAiSettings";

function loadAiSettings() {
    try {
        const raw = localStorage.getItem(AI_SETTINGS_KEY);
        if (!raw) return { engine: "tesseract" };
        return JSON.parse(raw);
    } catch (e) {
        return { engine: "tesseract" };
    }
}

function saveAiSettings(settings) {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

function updateKeyFieldVisibility(engine) {
    document.getElementById("geminiKeyGroup").style.display = (engine === "gemini") ? "block" : "none";
    document.getElementById("googleVisionKeyGroup").style.display = (engine === "google_vision") ? "block" : "none";
    document.getElementById("azureKeyGroup").style.display = (engine === "azure") ? "block" : "none";
}

function populateAiSettingsForm() {
    const settings = loadAiSettings();

    const engineSelect = document.getElementById("ocrEngineSelect");
    engineSelect.value = settings.engine || "tesseract";
    updateKeyFieldVisibility(engineSelect.value);

    document.getElementById("geminiApiKeyInput").value = settings.geminiKey || "";
    document.getElementById("googleVisionApiKeyInput").value = settings.googleVisionKey || "";
    document.getElementById("azureApiKeyInput").value = settings.azureKey || "";
    document.getElementById("azureEndpointInput").value = settings.azureEndpoint || "";
}

document.addEventListener("DOMContentLoaded", function () {
    const dialog = document.getElementById("aiSettingsDialog");
    const openBtn = document.getElementById("openAiSettingsBtn");
    const closeBtn = document.getElementById("closeAiSettingsBtn");
    const saveBtn = document.getElementById("saveAiSettingsBtn");
    const engineSelect = document.getElementById("ocrEngineSelect");

    if (!dialog || !openBtn) return;

    openBtn.addEventListener("click", function () {
        populateAiSettingsForm();
        dialog.showModal();
    });

    closeBtn.addEventListener("click", function () {
        dialog.close();
    });

    engineSelect.addEventListener("change", function () {
        updateKeyFieldVisibility(engineSelect.value);
    });

    saveBtn.addEventListener("click", function () {
        const settings = {
            engine: engineSelect.value,
            geminiKey: document.getElementById("geminiApiKeyInput").value.trim(),
            googleVisionKey: document.getElementById("googleVisionApiKeyInput").value.trim(),
            azureKey: document.getElementById("azureApiKeyInput").value.trim(),
            azureEndpoint: document.getElementById("azureEndpointInput").value.trim()
        };
        saveAiSettings(settings);
        dialog.close();
        const statusEl = document.getElementById("statusMsg");
        if (statusEl) {
            statusEl.textContent = "AI settings saved. Using: " + settings.engine + ".";
        }
    });
});

async function handleOcrSubmit(event, options = {}) {
    if (event) event.preventDefault();

    const form = document.querySelector("form");
    const statusEl = document.getElementById("statusMsg");
    const textArea = document.querySelector("textarea");
    const extractBtn = document.getElementById("extractBtn");
    const actionsDiv = document.getElementById("actions");
    const continueBtn = document.getElementById("continueBtn");
    const fileInput = document.getElementById("fileUpload");
    const pageSelectionInput = document.getElementById("pageSelection");

    if (!fileInput.files.length) {
        statusEl.textContent = "No file selected.";
        return false;
    }

    const append = options.append === true;

    if (options.nextRange) {
        pageSelectionInput.value = options.nextRange;
    }

    extractBtn.disabled = true;
    statusEl.setAttribute("tabindex", "-1");
    statusEl.focus();
    continueBtn.style.display = "none";
    if (!append) {
        textArea.value = "";
        actionsDiv.style.display = "none";
    }
    statusEl.textContent = "Starting OCR...";

    const formData = new FormData(form);

    try {
        const response = await fetch("/upload-stream", {
            method: "POST",
            body: formData
        });

        if (!response.body) {
            statusEl.textContent = "Streaming not supported by this browser.";
            extractBtn.disabled = false;
            return false;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;

                let data;
                try {
                    data = JSON.parse(line);
                } catch (e) {
                    continue;
                }

                if (data.type === "start") {
                    statusEl.textContent = "Processing 0 of " + data.total + " pages in this batch...";
                } else if (data.type === "page") {
                    if (data.total > 1) {
                        textArea.value += "\nPage " + data.page + "\n\n" + data.text + "\n";
                    } else {
                        textArea.value += data.text;
                    }
                    statusEl.textContent = "Processed page " + data.index + " of " + data.total + " in this batch.";
                } else if (data.type === "done") {
                    statusEl.textContent = data.message;
                    actionsDiv.style.display = textArea.value.trim() ? "block" : "none";
                    if (data.more && data.next_range) {
                        const [rStart, rEnd] = data.next_range.split("-").map(Number);
                        const batchEnd = Math.min(rEnd, rStart + 19);
                        continueBtn.textContent = "Continue with pages " + rStart + "-" + batchEnd;
                        continueBtn.style.display = "inline-block";
                        continueBtn.dataset.nextRange = data.next_range;
                    }
                } else if (data.type === "error") {
                    statusEl.textContent = data.message;
                }
            }
        }
    } catch (err) {
        statusEl.textContent = "OCR failed: " + err.message;
    } finally {
        extractBtn.disabled = false;
    }

    return false;
}

document.addEventListener("DOMContentLoaded", function () {
    const continueBtn = document.getElementById("continueBtn");
    if (continueBtn) {
        continueBtn.addEventListener("click", function () {
            const nextRange = continueBtn.dataset.nextRange;
            handleOcrSubmit(null, { append: true, nextRange: nextRange });
        });
    }
});

function t() {
    return document.querySelector("textarea");
}

function copyResult() {
    navigator.clipboard.writeText(t().value).then(() => {
        document.getElementById("copyMsg").textContent =
            "Text copied to clipboard.";
    });
}

function downloadTxt() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
        new Blob(
            [t().value],
            { type: "text/plain" }
        )
    );
    a.download = "ocr_result.txt";
    a.click();
}

function downloadDocx() {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/download-docx";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "text";
    input.value = t().value;

    form.appendChild(input);
    document.body.appendChild(form);

    form.submit();

    document.body.removeChild(form);
}