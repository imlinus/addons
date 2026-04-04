# Passwords Extension - Firefox Installation Guide

A secure, client-side encrypted password manager browser extension with VPS sync capability.

## Features

- 🔐 **Client-side encryption** - Your passwords never leave your computer unencrypted
- 🔄 **VPS Sync** - Optionally sync your encrypted vault across devices
- 📝 **Secure Notes** - Store encrypted notes alongside passwords
- 🎨 **Modern UI** - Beautiful, responsive interface with smooth animations
- 🌐 **Cross-browser** - Works in Firefox and other browsers

## Installation Instructions for Firefox

### Method 1: Temporary Installation (For Testing)

1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click on **"Load Temporary Add-on..."**
4. Navigate to the extension directory and select the `manifest.json` file
5. The extension will be loaded temporarily (until you restart Firefox)

### Method 2: Permanent Installation (Self-Signed)

For a more permanent installation that persists across browser restarts:

1. **Install web-ext** (if you haven't already):
   ```bash
   npm install -g web-ext
   ```

2. **Build and sign the extension**:
   ```bash
   cd /home/linus/Documents/code/passwords-extension/extension
   web-ext build
   web-ext sign --api-key=YOUR_API_KEY --api-secret=YOUR_API_SECRET
   ```

   Note: You'll need to get API credentials from:
   https://addons.mozilla.org/en-US/developers/addon/api/key/

3. **Install the signed .xpi file**:
   - Go to `about:addons`
   - Click the gear icon (⚙️)
   - Select "Install Add-on From File..."
   - Select the `.xpi` file from the `web-ext-artifacts` directory

### Method 3: Quick Testing (Using web-ext run)

For quick testing during development:

```bash
cd /home/linus/Documents/code/passwords-extension/extension
web-ext run
```

This will open a new Firefox instance with the extension loaded.

## Configuration

Before using the extension, update the API configuration in `popup/passwordPopup.js`:

```javascript
const API_URL = 'http://localhost:8080/password/api/index.php'; // Change to your VPS URL
const API_KEY = 'my-secret-api-key'; // Change to your API key
```

## Default Master Password

The default master password is configured in your API backend:
- Master Password: `KallesKaviar!35`

**Important**: Change this in your production environment!

## File Structure

```
extension/
├── manifest.json          # Extension configuration
├── icons/                 # Extension icons
│   ├── icon-48.png
│   └── icon-96.png
└── popup/                 # Popup interface
    ├── passwordPopup.html # Main HTML
    ├── passwordPopup.css  # Styling
    ├── passwordPopup.js   # Main logic
    ├── crypto.js          # Encryption utilities
    └── icons.js           # SVG icon library
```

## Security Notes

- All encryption happens client-side using the Web Crypto API
- Your master password is never sent to the server
- Passwords are encrypted before syncing to your VPS
- The extension uses AES-GCM encryption with PBKDF2 key derivation

## Troubleshooting

### Extension doesn't load
- Check the browser console for errors (F12)
- Verify all files are present in the extension directory
- Make sure manifest.json is valid JSON

### Sync not working
- Verify your API URL is correct and accessible
- Check CORS settings on your VPS
- Ensure your API key is correct

### Icons not showing
- Clear browser cache
- Reload the extension
- Check that icon files exist in the `icons/` directory

## Development

To make changes to the extension:

1. Edit the files in the `extension/` directory
2. Reload the extension:
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Reload" next to your extension
3. Test your changes

## Browser Compatibility

- **Firefox**: Version 109.0 or higher
- **Chrome/Edge**: Compatible with Manifest V3

## License

This is a personal project. Use at your own discretion.
