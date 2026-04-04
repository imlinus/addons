/* global chrome */

const selectors = {
  backdrop: 'section[data-testid="cdp-promo"] img',
  trailer: 'section[data-testid="cdp-promo"] video source[type="video/mp4"]',
  logo: 'main img[src*="originalsize.png"], main img.sc-761eab16-0'
}

async function getMediaSources () {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!tab.url.includes('tv4play.se') && !tab.url.includes('tv4.se')) {
    document.getElementById('status-message').textContent = 'Fungerar bara på TV4 Play'
    document.getElementById('status-message').classList.remove('is-hidden')
    return
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const main = document.getElementById('main_content')
        if (!main) return null

        // Backdrop is usually inside the promo section
        const promo = main.querySelector('section[data-testid="cdp-promo"]')
        const backdropImg = promo ? promo.querySelector('img') : main.querySelector('img')
        
        // Logo is often the second image or has a specific alt/class
        // In the snippet it's in a div with some specific classes
        const logoImg = main.querySelector('img[src*="originalsize.png"]') || 
                      main.querySelector('img.sc-761eab16-0') ||
                      main.querySelectorAll('img')[1]

        // Video / Trailer
        const trailerSource = main.querySelector('video source[type="video/mp4"]') || 
                            main.querySelector('video source')

        return {
          backdrop: backdropImg ? backdropImg.src : null,
          trailer: trailerSource ? trailerSource.src : null,
          logo: logoImg ? logoImg.src : null,
          title: document.title.split(' - ')[0] || 'tv4-media'
        }
      }
    })

    const media = results[0].result
    updateUI(media)
  } catch (err) {
    console.error('Failed to execute script:', err)
    document.getElementById('status-message').textContent = 'Kunde inte läsa sidan'
    document.getElementById('status-message').classList.remove('is-hidden')
  }
}

function updateUI (media) {
  const buttons = {
    backdrop: document.getElementById('download-backdrop'),
    trailer: document.getElementById('download-trailer'),
    logo: document.getElementById('download-logo')
  }

  let foundAny = false

  if (media.backdrop) {
    buttons.backdrop.disabled = false
    buttons.backdrop.onclick = () => download(media.backdrop, `backdrop.jpg`)
    foundAny = true
  }

  if (media.trailer) {
    buttons.trailer.disabled = false
    buttons.trailer.onclick = () => download(media.trailer, `trailer.mp4`)
    foundAny = true
  }

  if (media.logo) {
    buttons.logo.disabled = false
    buttons.logo.onclick = () => download(media.logo, `logo.png`)
    foundAny = true
  }

  if (!foundAny) {
    document.getElementById('status-message').classList.remove('is-hidden')
  }
}

function download (url, filename) {
  try {
    let finalUrl = url
    if (url && url.includes('imageproxy.a2d.tv')) {
      const urlObj = new URL(url)
      const sourceParam = urlObj.searchParams.get('source')
      if (sourceParam) {
        finalUrl = decodeURIComponent(sourceParam)
      } else {
        urlObj.searchParams.set('width', '3840')
        finalUrl = urlObj.toString()
      }
    }

    chrome.downloads.download({
      url: finalUrl,
      filename: filename.replace(/[/\\?%*:|"<>]/g, '-'),
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError.message)
      } else {
        console.log('Download started with ID:', downloadId)
      }
    })
  } catch (err) {
    console.error('Error preparing download:', err)
  }
}

document.addEventListener('DOMContentLoaded', getMediaSources)
