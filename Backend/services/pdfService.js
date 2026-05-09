// The app only extracts text. PDF.js attempts to load native canvas polyfills
// for rendering in Node, which creates noisy warnings when `canvas` is absent.
if (typeof globalThis.DOMMatrix === "undefined") {
    globalThis.DOMMatrix = class DOMMatrix {};
}

if (typeof globalThis.Path2D === "undefined") {
    globalThis.Path2D = class Path2D {};
}

const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

async function extractText(buffer) {
    try {
        const uint8Array = new Uint8Array(buffer);

        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array
        });

        const pdf = await loadingTask.promise;

        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);

            text += strings.join(" ") + "\n";
        }

        return text;
    } catch (error) {
        console.error("PDFJS ERROR:", error);
        throw new Error("Failed to parse PDF");
    }
}

module.exports = extractText;
