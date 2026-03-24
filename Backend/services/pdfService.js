const pdfModule = require("pdf-parse");

const pdfParse = pdfModule.default || pdfModule;

async function extractText(buffer) {
    const data = await pdfParse(buffer);
    return data.text;
}

module.exports = extractText;