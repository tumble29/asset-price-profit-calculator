import { t } from '@/i18n/messages'
import styles from './PipelineCheck.module.scss'

/**
 * Proves the Sass + Tailwind + CSS Modules pipeline works, and nothing else.
 *
 * It deliberately proposes no visual pattern: no colour, no font, no icon, no
 * layout shell. 0.5 (#7) owns the design system, and a placeholder that looks
 * designed gets copied into everything after it.
 *
 * Class names describe what the element is, never how it looks.
 */
export function PipelineCheck() {
  return (
    <section className={styles.pipelineCheck}>
      <h1 className={styles.heading}>{t('pipelineCheck.heading')}</h1>
      <p className={styles.body}>{t('pipelineCheck.body')}</p>
    </section>
  )
}
