#!/usr/bin/env node

/**
 * Generate ASCII art text using figlet (ANSI Shadow font).
 *
 * Usage:
 *   npm run ascii "HELLO WORLD"
 *   npm run ascii -- --text "MY TEXT"
 *
 * Output can be copied directly into a component as a template literal.
 */

const figlet = require("figlet");
const font = require("figlet/importable-fonts/ANSI Shadow.js");

figlet.parseFont("ANSI Shadow", font.default || font);

const text = process.argv.slice(2).join(" ");

if (!text) {
  console.error("Usage: npm run ascii <text>");
  console.error('Example: npm run ascii "CONNOR"');
  process.exit(1);
}

const result = figlet.textSync(text, {
  font: "ANSI Shadow",
  horizontalLayout: "fitted",
  verticalLayout: "fitted",
});

console.log("\n--- Copy below ---\n");
console.log(result);
console.log("\n--- End ---\n");

// Also output as a JS template literal for easy pasting
const escaped = result.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
console.log("As a JS constant:\n");
console.log(`const ASCII_TEXT = \`${escaped}\`;`);
console.log("");
