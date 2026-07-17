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