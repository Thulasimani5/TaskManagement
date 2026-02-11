const highlight = '(';
// Mimic the fix logic
const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

try {
    const regex = new RegExp(`(${safeHighlight})`, 'gi');
    console.log('Success: Converted "' + highlight + '" to "' + safeHighlight + '"');
    const text = "Some text with (parentheses)";
    const parts = text.split(regex);
    console.log('Split parts:', parts);
} catch (e) {
    console.error('Failed:', e.message);
    process.exit(1);
}
