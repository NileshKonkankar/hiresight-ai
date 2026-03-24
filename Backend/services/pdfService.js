const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

async function extractText(buffer) {
    try {

        // ✅ CRITICAL: convert buffer properly
        const uint8Array = new Uint8Array(buffer);

        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array
        });

        const pdf = await loadingTask.promise;
        console.log("TYPE:", buffer.constructor.name);

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