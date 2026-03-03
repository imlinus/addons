// Cosmetic Filtering Content Script
// Dynamically finds and hides ad containers

(function() {
    'use strict';

    // Patterns for ad-related attributes
    const AD_PATTERNS = [
        /\bad[s]?\b/i,
        /advert/i,
        /sponsor/i,
        /promo/i,
        /banner/i,
        /commercial/i,
        /publi/i,
        /marketing/i
    ];

    // Hide element by setting display: none and collapsing height
    function hideElement(element) {
        if (element && element.style) {
            element.style.setProperty('display', 'none', 'important');
            element.style.setProperty('height', '0', 'important');
            element.style.setProperty('min-height', '0', 'important');
            element.style.setProperty('max-height', '0', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty('margin', '0', 'important');
            element.style.setProperty('padding', '0', 'important');
            element.style.setProperty('overflow', 'hidden', 'important');
        }
    }

    // Check if element matches ad patterns
    function isAdElement(element) {
        if (!element || !element.getAttribute) return false;

        // Check common attributes
        const attributes = ['id', 'class', 'data-ad-slot', 'data-ad-client', 'data-testid'];
        
        for (const attr of attributes) {
            const value = element.getAttribute(attr);
            if (value) {
                for (const pattern of AD_PATTERNS) {
                    if (pattern.test(value)) {
                        return true;
                    }
                }
            }
        }

        // Check if it's an iframe with ad dimensions
        if (element.tagName === 'IFRAME') {
            const width = parseInt(element.getAttribute('width'));
            const height = parseInt(element.getAttribute('height'));
            
            // Common IAB ad sizes
            const adSizes = [
                [728, 90], [300, 250], [336, 280], [320, 50],
                [320, 100], [468, 60], [234, 60], [120, 600],
                [160, 600], [300, 600], [970, 250], [970, 90]
            ];
            
            for (const [w, h] of adSizes) {
                if (width === w && height === h) {
                    return true;
                }
            }
        }

        return false;
    }

    // Find and hide ad elements
    function findAndHideAds() {
        // Get all elements
        const elements = document.querySelectorAll('*');
        let hiddenCount = 0;

        elements.forEach(element => {
            if (isAdElement(element)) {
                hideElement(element);
                hiddenCount++;
            }
        });

        if (hiddenCount > 0) {
            console.log(`[DIY AdBlock] Hidden ${hiddenCount} ad containers`);
        }
    }

    // Observe DOM changes and hide new ad elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (isAdElement(node)) {
                        hideElement(node);
                    }
                    
                    // Check children
                    if (node.querySelectorAll) {
                        node.querySelectorAll('*').forEach(child => {
                            if (isAdElement(child)) {
                                hideElement(child);
                            }
                        });
                    }
                }
            });
        });
    });

    // Start observing
    function startObserver() {
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            findAndHideAds();
            startObserver();
        });
    } else {
        findAndHideAds();
        startObserver();
    }

    // Run periodically to catch dynamically loaded ads
    setInterval(findAndHideAds, 2000);

})();
