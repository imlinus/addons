# Encrypted Vault

A simple, secure password, 2FA, and notes manager for Firefox.

## Features
- **Client-Side Encryption**: Your data is encrypted in your browser using AES-256-GCM before it ever leaves your machine.
- **PHP Flat-file API**: Simple backend that pretty much runs on any host.
- **Premium Design**: Sleek dark mode interface with glassmorphism.
- **Notes, Passwords & 2FA**: Store your credentials, secure notes, and Time-based One-Time Passwords (TOTP).
- **Password Generator**: Built-in 16-character secure random password generator.
- **Smart Sync**: Conflict handling and deletion tracking when syncing with your VPS.

## Setup Instructions

### 1. VPS Setup (API)
1. Upload the contents of the `api/` folder to your VPS (e.g., in `/public_html/api/`).
2. Ensure the directory is writable by the web server (`chown -R www-data:www-data api/`).
3. Set your `API_KEY` in `api/index.php`.
4. (Optional) Enhance security by using HTTPS and adding `.htaccess` to protect the `passwords.json` file directly.

### 2. Extension Setup
1. Open Firefox and go to `about:debugging`.
2. Click "This Firefox" -> "Load Temporary Add-on".
3. Select the `manifest.json` from the `extension/` folder.
4. **Important**: Open `extension/popup/passwordPopup.js` and update:
   - `API_URL`: Point this to your VPS (e.g., `https://your-vps.com/api/index.php`).
   - `API_KEY`: Match the key set in your PHP file.

## Manifest Details
This extension uses Manifest V3 and requests the following specific permissions:
- `storage`: Required to securely save your encrypted vault inside the browser's local storage.
- `*://*/*`: Requested host permissions so the extension can correctly sync with your self-hosted VPS API seamlessly.

## Security
- **Encryption**: Web Crypto API (SubtleCrypto).
- **Algorithm**: AES-GCM 256-bit.
- **Key Derivation**: PBKDF2 with 600,000 iterations (OWASP recommended standard).
- **Master Password**: Saved only in your browser's session memory to keep you logged in while avoiding persistent disk storage.