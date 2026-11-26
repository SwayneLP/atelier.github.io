// Dimensions en millimètres. Les formats standard sont définis dans index.html.
function showDimensions(width, height) { $('w').value = Number(width.toFixed(2)); $('h').value = Number(height.toFixed(2)); }
function syncPaper() {
    const format = val('paper');
    const custom = format === 'custom';
    $('w').readOnly = $('h').readOnly = !custom;
    if (format === 'auto') {
        if (!source) {
            $('w').value = '';
            $('h').value = '';
        }
        return;
    }
    if (custom) {
        if (!num('w') || !num('h'))
            showDimensions(420, 297);
        return;
    }
    const dimensions = format.split(',').map(Number).sort((a, b) => val('orient') === 'land' ? b - a : a - b);
    showDimensions(...dimensions);
}
