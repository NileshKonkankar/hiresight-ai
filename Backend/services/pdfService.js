const pdf = require("pdf-parse");

async function extractText(dataBuffer) {

    const data = await pdf(dataBuffer);

    return data.text;

}

module.exports = extractText;