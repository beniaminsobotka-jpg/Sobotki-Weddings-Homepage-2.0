const TYPOGRAPHY_SELECTOR = 'p, li, blockquote, figcaption, h1, h2, h3, h4, h5, h6';
const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);
const NBSP = '\u00A0';

const fixSingleLetterWords = (text: string) =>
  text.replace(/(^|[\s([{"'“„-])([AaIiOoUuWwZz])\s+(?=\S)/g, (_, prefix: string, letter: string) => {
    return `${prefix}${letter}${NBSP}`;
  });

const fixWidow = (text: string) => {
  const normalized = text.trim();
  const words = normalized.split(/\s+/);

  if (words.length < 3) {
    return text;
  }

  return text.replace(/\s+([^\s]+)\s*$/, `${NBSP}$1`);
};

const shouldSkipTextNode = (node: Text) => {
  const parent = node.parentElement;
  return !parent || EXCLUDED_TAGS.has(parent.tagName);
};

const polishTextNode = (node: Text) => {
  if (shouldSkipTextNode(node)) {
    return;
  }

  const nextValue = fixSingleLetterWords(node.nodeValue ?? '');

  if (nextValue !== node.nodeValue) {
    node.nodeValue = nextValue;
  }
};

export const applyPolishTypography = (root: ParentNode) => {
  const elements = root.querySelectorAll<HTMLElement>(TYPOGRAPHY_SELECTOR);

  elements.forEach((element) => {
    element.classList.add('text-pretty');

    if (element.children.length === 0) {
      const currentText = element.textContent ?? '';
      const nextText = fixWidow(fixSingleLetterWords(currentText));

      if (nextText !== currentText) {
        element.textContent = nextText;
      }

      return;
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode();

    while (currentNode) {
      polishTextNode(currentNode as Text);
      currentNode = walker.nextNode();
    }
  });
};
