try {
    const highlight = "(";
    // Current implementation
    const safeHighlight1 = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    console.log('Implementation 1 (current):', safeHighlight1);
    console.log('Length:', safeHighlight1.length);

    try {
        new RegExp(safeHighlight1);
        console.log('RegExp 1 success');
    } catch (e) {
        console.error('RegExp 1 failed:', e.message); // Expect this to fail if my theory is correct
    }

    // Proposed implementation (double escape)
    const safeHighlight2 = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
    console.log('Implementation 2 (proposed):', safeHighlight2);
    console.log('Length:', safeHighlight2.length);

    try {
        new RegExp(safeHighlight2);
        console.log('RegExp 2 success');
    } catch (e) {
        console.error('RegExp 2 failed:', e.message);
    }

} catch (e) {
    console.error(e);
}
