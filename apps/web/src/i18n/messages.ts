/**
 * Placeholder message catalogue.
 *
 * 0.3 (#5) replaces this with the real i18n layer. It exists at 0.1 for one
 * reason: #1 forbids a hardcoded user-facing string in a component, and that
 * applies to a placeholder page too, because placeholders get copied.
 *
 * Vietnamese is the default because #1 puts Vietnamese at the root and English
 * under `/en/`.
 */

export const locales = ['vi', 'en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'vi'

export type MessageKey = 'app.name' | 'pipelineCheck.heading' | 'pipelineCheck.body'

const messages: Record<Locale, Record<MessageKey, string>> = {
  vi: {
    'app.name': 'iKhobau',
    'pipelineCheck.heading': 'Kiểm tra quy trình dựng',
    'pipelineCheck.body':
      'Thành phần này được tạo kiểu hoàn toàn bằng @apply trong một tệp module.scss.',
  },
  en: {
    'app.name': 'iKhobau',
    'pipelineCheck.heading': 'Build pipeline check',
    'pipelineCheck.body': 'This component is styled entirely through @apply in a module.scss file.',
  },
}

export function t(key: MessageKey, locale: Locale = defaultLocale): string {
  return messages[locale][key]
}

/** Exported for the parity test, which is the thing that catches a missing translation. */
export const catalogue = messages
