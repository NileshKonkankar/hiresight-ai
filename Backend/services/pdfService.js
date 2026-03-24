async function extractText(buffer) {
    try {

        if (!pdfParse) {
            throw new Error("pdfParse not loaded properly");
        }

        const data = await pdfParse(buffer);

        return data.text;

    } catch (error) {
        console.error("PDF PARSE ERROR:", error.message);
        throw new Error("Failed to parse PDF");
    }
}

module.exports = extractText;