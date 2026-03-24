const fs = require("fs");
const pdf = require("pdf-parse");
const path = require("path");

async function extractText(filePath) {

    const dataBuffer = fs.readFileSync(path.resolve(filePath));

    const data = await pdf(dataBuffer);

    return data.text;

}

module.exports = extractText;