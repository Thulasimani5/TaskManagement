const highlight = '(';
const textWithNumber = 12345;
const textWithNull = null; // Should be handled by early return in component, but let's test the logic if it somehow passed
const textWithString = "Test string with (parentheses)";

function testHighlight(text, highlight) {
    try {
        if (!highlight || !text) {
            console.log("Skipped (empty/null)");
            return;
        }

        // Logic from HighlightText.jsx
        const strText = String(text);
        const strHighlight = String(highlight);
        const safeHighlight = strHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = strText.split(new RegExp(`(${safeHighlight})`, 'gi'));

        console.log(`Success for text: "${text}", highlight: "${highlight}" -> parts:`, parts);
    } catch (e) {
        console.error(`Crashed for text: "${text}", highlight: "${highlight}"`, e.message);
        process.exit(1);
    }
}

testHighlight(textWithNumber, "23");
testHighlight(textWithString, "(");
testHighlight("Simple text", "[");
console.log("All robust tests passed");
