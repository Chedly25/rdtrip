/**
 * Emoji Replacer - Replaces emoji with PNG images throughout the DOM
 */

(function() {
    // Map emojis to their image files
    const emojiToImage = {
        '🏔️': { src: '/adventure.png', alt: 'Adventure', size: 48 },
        '🏛️': { src: '/culture.png', alt: 'Culture', size: 48 },
        '🍽️': { src: '/food.png', alt: 'Food', size: 48 }
    };

    /**
     * Replace emojis in text nodes with image elements
     */
    function replaceEmojisInDOM() {
        // Get all text nodes in the document
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip script and style tags
                    const parent = node.parentNode;
                    if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Check if node contains any of our emojis
                    for (const emoji of Object.keys(emojiToImage)) {
                        if (node.textContent.includes(emoji)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            }
        );

        const nodesToReplace = [];
        while (walker.nextNode()) {
            nodesToReplace.push(walker.currentNode);
        }

        // Replace the emojis in each text node
        nodesToReplace.forEach(node => {
            const parent = node.parentNode;
            let text = node.textContent;
            let hasEmoji = false;

            // Check if we need to replace any emoji
            for (const emoji of Object.keys(emojiToImage)) {
                if (text.includes(emoji)) {
                    hasEmoji = true;
                    break;
                }
            }

            if (hasEmoji) {
                // Create a document fragment to hold the new content
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;

                // Process the text to find and replace emojis
                for (let i = 0; i < text.length; i++) {
                    // Check each emoji
                    for (const [emoji, imgData] of Object.entries(emojiToImage)) {
                        if (text.substr(i, emoji.length) === emoji) {
                            // Add text before emoji
                            if (i > lastIndex) {
                                fragment.appendChild(
                                    document.createTextNode(text.substring(lastIndex, i))
                                );
                            }

                            // Create and add image
                            const img = document.createElement('img');
                            img.src = imgData.src;
                            img.alt = imgData.alt;
                            img.style.width = `${imgData.size}px`;
                            img.style.height = `${imgData.size}px`;
                            img.style.verticalAlign = 'middle';
                            img.style.display = 'inline-block';
                            img.style.margin = '0 4px';
                            img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))';
                            img.style.borderRadius = '4px';
                            fragment.appendChild(img);

                            // Update indices
                            i += emoji.length - 1;
                            lastIndex = i + 1;
                            break;
                        }
                    }
                }

                // Add remaining text
                if (lastIndex < text.length) {
                    fragment.appendChild(
                        document.createTextNode(text.substring(lastIndex))
                    );
                }

                // Replace the text node with the fragment
                parent.replaceChild(fragment, node);
            }
        });
    }

    /**
     * Replace emojis in dynamically added content
     */
    function setupObserver() {
        const observer = new MutationObserver(mutations => {
            let shouldReplace = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                            const text = node.textContent || '';
                            for (const emoji of Object.keys(emojiToImage)) {
                                if (text.includes(emoji)) {
                                    shouldReplace = true;
                                    break;
                                }
                            }
                        }
                    });
                }
            });

            if (shouldReplace) {
                // Debounce to avoid too many replacements
                clearTimeout(window.emojiReplaceTimeout);
                window.emojiReplaceTimeout = setTimeout(() => {
                    replaceEmojisInDOM();
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            replaceEmojisInDOM();
            setupObserver();
        });
    } else {
        // DOM is already loaded
        setTimeout(() => {
            replaceEmojisInDOM();
            setupObserver();
        }, 100);
    }

    // Export for manual use if needed
    window.replaceEmojis = replaceEmojisInDOM;
})();