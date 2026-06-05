import { ContentSection } from '../components/content-section'
import { NotificationsForm } from './notifications-form'

export function SettingsNotifications() {
  return (
    <ContentSection
      title='通知设置'
      desc='配置消息通知的接收方式。'
    >
      <NotificationsForm />
    </ContentSection>
  )
}
