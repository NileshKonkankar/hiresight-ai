import pdfParse from "pdf-parse";

async function extractText(buffer) {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error("PDF PARSE ERROR:", error.message);
        throw new Error("Failed to parse PDF");
    }
}

export default extractText;