/** 导航栏外部链接（新标签页打开） */
export interface ExternalLink {
  labelKey: string
  href: string
}

export const externalLinks: ExternalLink[] = [
  { labelKey: 'nav.github', href: 'https://github.com/Mistvillion' },
  { labelKey: 'nav.blogs', href: 'https://blog.sparklerain.top/' },
  { labelKey: 'nav.notes', href: 'https://note.sparklerain.top/' },
]
