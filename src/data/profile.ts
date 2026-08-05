/**
 * 个人简介数据（占位）。
 * 文案通过 i18n key 引用，见 src/i18n/locales/{zh,en}.json 的 profile.* 字段；
 * 后续新增章节时在此追加条目即可。
 */
export interface ProfileSection {
  titleKey: string
  paragraphs: string[]
}

export const profileSections: ProfileSection[] = [
  {
    titleKey: 'profile.title',
    paragraphs: ['profile.bio'],
  },
]
