import { ContentSection } from '../components/content-section'
import { DisplayForm } from './display-form'

export function SettingsDisplay() {
  return (
    <ContentSection
      title='显示设置'
      desc='控制界面中显示的模块和内容。'
    >
      <DisplayForm />
    </ContentSection>
  )
}
