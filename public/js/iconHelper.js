/**
 * Icon Helper - Manages custom icon replacements
 * Replaces emojis with actual image files where needed
 */

class IconHelper {
    constructor() {
        // Map of icon types to their image files
        this.iconMap = {
            'adventure': '/adventure.png',
            'culture': '/culture.png',
            'food': '/food.png'
        };

        // Map of emojis to icon types
        this.emojiMap = {
            '🏔️': 'adventure',
            '🏛️': 'culture',
            '🍽️': 'food'
        };
    }

    /**
     * Creates an img element for an icon type
     * @param {string} iconType - The type of icon (adventure, culture, food)
     * @param {number} size - Size in pixels (default: 20)
     * @returns {HTMLElement} - IMG element
     */
    createIconElement(iconType, size = 20) {
        const img = document.createElement('img');
        img.src = this.iconMap[iconType] || '';
        img.alt = iconType.charAt(0).toUpperCase() + iconType.slice(1);
        img.style.width = `${size}px`;
        img.style.height = `${size}px`;
        img.style.verticalAlign = 'middle';
        img.style.display = 'inline-block';
        return img;
    }

    /**
     * Replaces emoji text with actual image element
     * @param {string} emoji - The emoji to replace
     * @param {number} size - Size in pixels
     * @returns {HTMLElement|string} - IMG element or original emoji if no replacement
     */
    replaceEmoji(emoji, size = 20) {
        const iconType = this.emojiMap[emoji];
        if (iconType) {
            return this.createIconElement(iconType, size);
        }
        return emoji;
    }

    /**
     * Processes a DOM element to replace emoji text nodes with images
     * @param {HTMLElement} element - The element to process
     */
    processElement(element) {
        if (!element) return;

        // Walk through all text nodes
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const nodesToReplace = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const text = node.textContent;

            // Check if text contains any of our emojis
            for (const emoji of Object.keys(this.emojiMap)) {
                if (text.includes(emoji)) {
                    nodesToReplace.push({ node, emoji });
                }
            }
        }

        // Replace the nodes
        nodesToReplace.forEach(({ node, emoji }) => {
            const text = node.textContent;
            const parts = text.split(emoji);
            const fragment = document.createDocumentFragment();

            parts.forEach((part, index) => {
                if (part) {
                    fragment.appendChild(document.createTextNode(part));
                }
                if (index < parts.length - 1) {
                    const iconType = this.emojiMap[emoji];
                    fragment.appendChild(this.createIconElement(iconType));
                }
            });

            node.parentNode.replaceChild(fragment, node);
        });
    }

    /**
     * Gets the icon for a specific type
     * @param {string} type - The icon type
     * @returns {string} - Either emoji or icon identifier
     */
    getIcon(type) {
        // Return icon identifier that can be processed later
        return `icon:${type}`;
    }

    /**
     * Checks if a string is an icon identifier
     * @param {string} str - String to check
     * @returns {boolean}
     */
    isIconIdentifier(str) {
        return typeof str === 'string' && str.startsWith('icon:');
    }

    /**
     * Renders an icon identifier to HTML
     * @param {string} identifier - Icon identifier
     * @param {number} size - Size in pixels
     * @returns {string} - HTML string
     */
    renderIconHTML(identifier, size = 20) {
        if (this.isIconIdentifier(identifier)) {
            const type = identifier.replace('icon:', '');
            if (this.iconMap[type]) {
                return `<img src="${this.iconMap[type]}" alt="${type}" style="width: ${size}px; height: ${size}px; vertical-align: middle;">`;
            }
        }
        return identifier;
    }
}

// Export singleton instance
const iconHelper = new IconHelper();
window.iconHelper = iconHelper;

export default iconHelper;