import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile() {
  return (
    <ContentSection
      title='个人信息'
      desc='其他用户将看到这些信息。'
    >
      <ProfileForm />
    </ContentSection>
  )
}
