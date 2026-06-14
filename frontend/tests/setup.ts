import '@testing-library/jest-dom'
// Initialize i18n so components using useTranslation() render real (English)
// strings in tests without needing an explicit provider.
import '@/i18n'

// jsdom does not implement layout methods. The chat view auto-scrolls via
// scrollIntoView; stub it so components that call it can render in tests.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

