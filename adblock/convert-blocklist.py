"""
DIY AdBlock - Blocklist Converter
Converts multiple blocklists to declarativeNetRequest JSON format
Supports Adblock syntax and HOSTS format
"""

import json
import urllib.request
import re
import sys

# Blocklist Configuration
BLOCKLISTS = [
    {
        "url": "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.mini.txt",
        "format": "adblock",
        "name": "Hagezi Pro Mini"
    },
    {
        "url": "https://blocklistproject.github.io/Lists/ads.txt",
        "format": "hosts",
        "name": "Blocklist Project Ads"
    },
    {
        "url": "https://raw.githubusercontent.com/lassekongo83/Frellwits-filter-lists/master/Frellwits-Swedish-Filter.txt",
        "format": "adblock",
        "name": "Frellwit's Swedish Filter"
    }
]

# Firefox declarativeNetRequest limit per ruleset (MV3 limit is 300k)
MAX_RULES = 300000

def download_blocklist(url, name):
    """Download the blocklist from URL"""
    print(f"📥 Downloading {name}...")
    try:
        # User-Agent header is often required
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8')
        print(f"  ✓ Downloaded {len(content)} bytes")
        return content
    except Exception as e:
        print(f"  ✗ Error downloading {name}: {e}")
        return None

def parse_adblock_list(content):
    """Parse adblock format (||domain.com^)"""
    domains = set()
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith('!') or line.startswith('#'):
            continue
        match = re.match(r'\|\|([a-zA-Z0-9\.\-]+)\^', line)
        if match:
            domains.add(match.group(1))
    return domains

def parse_hosts_list(content):
    """Parse HOSTS format (0.0.0.0 domain.com)"""
    domains = set()
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        
        # Remove 0.0.0.0 or 127.0.0.1
        parts = line.split()
        if len(parts) >= 2:
            domain = parts[1]
            # Simple domain validation
            if '.' in domain and not domain.startswith('#'):
                 domains.add(domain)
    return domains

def create_declarative_rules(domains, max_rules=MAX_RULES):
    """Convert domains to declarativeNetRequest rules"""
    rules = []
    
    # Sort for consistency
    sorted_domains = sorted(domains)
    limited_domains = sorted_domains[:max_rules]
    
    for idx, domain in enumerate(limited_domains, start=1):
        rule = {
            "id": idx,
            "priority": 1,
            "action": {
                "type": "block"
            },
            "condition": {
                "urlFilter": f"||{domain}",
                "resourceTypes": [
                    "main_frame",
                    "sub_frame",
                    "stylesheet",
                    "script",
                    "image",
                    "font",
                    "object",
                    "xmlhttprequest",
                    "ping",
                    "media",
                    "other"
                ]
            }
        }
        rules.append(rule)
    
    if len(domains) > max_rules:
        print(f"⚠️  Warning: Merged list has {len(domains)} domains.")
        print(f"   Truncating to {max_rules} to fit browser limits.")
    else:
        print(f"✓ Created {len(rules)} distinct blocking rules")
    
    return rules

def save_rules(rules, output_file):
    """Save rules to JSON file"""
    try:
        with open(output_file, 'w') as f:
            json.dump(rules, f, indent=2)
        print(f"✓ Saved rules to {output_file}")
        print(f"📊 File size: {len(json.dumps(rules)) / 1024:.1f} KB")
    except Exception as e:
        print(f"✗ Error saving file: {e}")
        sys.exit(1)

def main():
    print("🛡️  DIY AdBlock - Blocklist Converter\n")
    
    all_domains = set()
    
    for blocklist in BLOCKLISTS:
        content = download_blocklist(blocklist['url'], blocklist['name'])
        if content:
            if blocklist['format'] == 'adblock':
                domains = parse_adblock_list(content)
            elif blocklist['format'] == 'hosts':
                domains = parse_hosts_list(content)
            else:
                print(f"  ✗ Unknown format: {blocklist['format']}")
                continue
            
            print(f"  + Found {len(domains)} domains")
            all_domains.update(domains)
            
    print(f"\nΣ Total unique domains: {len(all_domains)}")
    
    # Create rules
    rules = create_declarative_rules(list(all_domains))
    
    # Save to file
    output_file = "rules/blocklist.json"
    save_rules(rules, output_file)
    
    print(f"\n✅ Done! Extension ready to repack.")

if __name__ == "__main__":
    main()
