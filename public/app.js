// Accessibility prefs
const fontScale = Number(localStorage.getItem("grokide:fontScale") || "1.0");
const contrast = localStorage.getItem("grokide:contrast") || "normal";

document.documentElement.style.fontSize = `${Math.round(fontScale * 100)}%`;
document.documentElement.dataset.contrast = contrast;
