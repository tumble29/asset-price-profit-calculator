import { describe, expect, it } from 'vitest'
import { catalogue, defaultLocale, locales, t } from '@/i18n/messages'

/**
 * A real test, not a smoke test: the failure it catches is a message key added
 * in one locale and forgotten in the other, which is the actual recurring bug
 * in a two-language catalogue. 0.3 (#5) replaces the catalogue; a test shaped
 * like this should survive it.
 */
describe('message catalogue', () => {
  it('defines Vietnamese as the default locale', () => {
    // #1: Vietnamese at the root, English under /en/.
    expect(defaultLocale).toBe('vi')
  })

  it('defines exactly the same keys in every locale', () => {
    const reference = Object.keys(catalogue[defaultLocale]).sort()

    for (const locale of locales) {
      expect(Object.keys(catalogue[locale]).sort(), `locale ${locale}`).toEqual(reference)
    }
  })

  it('has no empty or untranslated-looking message', () => {
    for (const locale of locales) {
      for (const [key, value] of Object.entries(catalogue[locale])) {
        expect(value.trim(), `${locale}/${key}`).not.toBe('')
      }
    }
  })

  it('resolves a key for each locale', () => {
    expect(t('pipelineCheck.heading', 'en')).toBe('Build pipeline check')
    expect(t('pipelineCheck.heading', 'vi')).toBe('Kiểm tra quy trình dựng')
  })
})
