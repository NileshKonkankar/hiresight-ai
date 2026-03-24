const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

// Disable the worker (Node.js environment — no browser worker needed)
pdfjsLib.GlobalWorkerOptions.workerSrc = false;

/**
 * Extracts plain text from a PDF buffer using pdfjs-dist.
 * @param {Buffer} buffer - The PDF file buffer
 * @returns {Promise<string>} - Extracted text content
 */
async function extractText(buffer) {
    try {
        const uint8Array = new Uint8Array(buffer);

        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdfDocument = await loadingTask.promise;

        const numPages = pdfDocument.numPages;
        const pageTexts = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ");
            pageTexts.push(pageText);
        }

        return pageTexts.join("\n");
    } catch (error) {
        console.error("PDF PARSE ERROR:", error.message);
        throw new Error("Failed to parse PDF");
    }
}

module.exports = extractText;