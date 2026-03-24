const pdfjsLib = require("pdfjs-dist");

async function extractText(buffer) {
    try {

        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true
        });

        const pdf = await loadingTask.promise;

        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
                .map(item => item.str)
                .join(" ");

            fullText += pageText + "\n";
        }

        if (!fullText.trim()) {
            throw new Error("Empty PDF");
        }

        return fullText;

    } catch (error) {
        console.error("PDFJS ERROR:", error.message);
        throw new Error("Failed to parse PDF");
    }
}

module.exports = extractText;