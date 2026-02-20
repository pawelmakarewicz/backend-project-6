import i18next from 'i18next'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const en = JSON.parse(
  readFileSync(join(__dirname, '..', 'locales', 'en', 'translation.json'), 'utf8'),
)

await i18next.init({
  lng: 'en',
  resources: {
    en: { translation: en },
  },
})

export default i18next
