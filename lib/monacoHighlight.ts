import * as monaco from "monaco-editor";

// Editor oluştur
const editor = monaco.editor.create(document.getElementById("container")!, {
  value: 'console.log("Hello World");\nlet x: number = 10;',
  language: "typescript",
});

// Tema tanımla
monaco.editor.defineTheme("customTheme", {
  base: "vs",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#ffffff",
  },
});

// CSS ile highlight stilini ekle
const style = document.createElement("style");
style.innerHTML = `
  .my-highlight {
    background-color: yellow !important;
  }
`;
document.head.appendChild(style);

export { editor };
