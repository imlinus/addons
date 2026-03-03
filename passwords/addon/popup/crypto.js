/**
 * Crypto utility for password manager
 * Uses AES-GCM and PBKDF2 from Web Crypto API
 */

/**
 * Gets the master password from session storage
 */
async function getMasterPassword() {
    if (chrome && chrome.storage && chrome.storage.session) {
        const result = await chrome.storage.session.get('master_password');
        return result.master_password;
    }
    return sessionStorage.getItem('master_password');
}

/**
 * Sets the master password in session storage
 */
async function setMasterPassword(password) {
    if (chrome && chrome.storage && chrome.storage.session) {
        await chrome.storage.session.set({ 'master_password': password });
    }
    sessionStorage.setItem('master_password', password);
}

const SALT = new TextEncoder().encode("5hOODgZXL9pW/!W/tsl4-3Z^CV2OqQhp66eB(z!W3Af#O6u3%csAjA[HnLj^T~}A"); // Fixed salt for simplicity, ideally random per-user but this is local-only storage logic

/**
 * Derives a key from the master password
 */
async function deriveKey(password) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: SALT,
            iterations: 600000,
            hash: "SHA-256",
        },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts a string
 */
async function encrypt(text) {
    const password = await getMasterPassword();
    if (!password) throw new Error("No master password set");

    const key = await deriveKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoded
    );

    // Combine IV and ciphertext for storage
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Convert to Base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64 string
 */
async function decrypt(base64Ciphertext) {
    try {
        const password = await getMasterPassword();
        if (!password) throw new Error("No master password set");

        const key = await deriveKey(password);
        const combined = new Uint8Array(
            atob(base64Ciphertext).split("").map((c) => c.charCodeAt(0))
        );

        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        return null;
    }
}

// Export functions to global scope for use in popup.js
window.cryptoUtils = { encrypt, decrypt, getMasterPassword, setMasterPassword };
