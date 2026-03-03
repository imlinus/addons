# AdBlock

A lightweight, DIY adblocker browser addon using a curated 300,000+ domain blocklist.

## Features

**300,000+ Blocked Domains** - Merges Hagezi Pro Mini, Blocklist Project Ads, and Frellwit's Swedish Filter
**Cosmetic Filtering** - Hides common ad containers directly from the page
**Lightweight & Fast** - Uses the browser's native `declarativeNetRequest` API (Manifest V3)
**Auto-updating script** - Simple Python script to fetch the latest blocklist definitions

## Installation

1. Open Firefox developer edition and navigate to `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on..."**
3. Select the `manifest.json` file from the addon folder

## Customizing & Updating the Blocklists

The `convert-blocklist.py` script automatically fetches the latest domain blocks and converts them into the format Firefox expects.

To fetch the latest versions of the lists or after modifying the python script to add new lists:

```bash
cd adblock/
python3 convert-blocklist.py
```
After running the script to generate the new `rules/blocklist.json`, click **"Reload"** inside Firefox's `about:debugging` tab to apply the new rules.

## Credits

- **Blocklists**: [Hagezi](https://github.com/hagezi/dns-blocklists), [Blocklist Project](https://blocklistproject.github.io/Lists/), and [Frellwit](https://github.com/lassekongo83/Frellwits-filter-lists)
- **Engine**: MV3 `declarativeNetRequest` + Cosmetic observers.
