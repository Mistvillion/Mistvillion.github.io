/**
 * Giscus 留言板配置。
 * 通过 https://giscus.app 生成；repo-id / category-id 由 GitHub GraphQL 节点 id 构成，
 * 更换仓库或分类后需同步更新。
 */
export const guestbook = {
  repo: 'Mistvillion/Mistvillion.github.io',
  repoId: 'R_kgDORL2RGQ',
  category: 'Announcements',
  categoryId: 'DIC_kwDORL2RGc4DCuBS',
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'bottom',
  /** transparent_dark：贴合本站暗色玻璃拟态设计 */
  theme: 'transparent_dark',
} as const

export const isGuestbookConfigured = guestbook.categoryId.trim() !== ''
