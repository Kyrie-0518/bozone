import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  return (
    <ContentSection
      title='外观主题'
      desc='自定义应用外观，支持日间/夜间主题自动切换。'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
