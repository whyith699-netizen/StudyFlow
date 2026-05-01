const DEFAULT_ICON = 'fa-globe'

export function buildFaviconUrl(siteUrl = '') {
  try {
    const parsed = new URL(siteUrl)
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(parsed.origin)}&sz=128`
  } catch {
    return ''
  }
}

export function isValidStudyToolUrl(value = '') {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeStudyTool(tool, index = 0) {
  const launchUrl = tool?.launchUrl || tool?.url || ''
  const createdAt = Number(tool?.createdAt || 0)
  const updatedAt = Number(tool?.updatedAt || createdAt || 0)

  return {
    id: tool?.id || `tool_${Date.now()}_${index}`,
    name: tool?.name || '',
    description: tool?.description || '',
    nameKey: tool?.nameKey || '',
    descKey: tool?.descKey || '',
    launchUrl,
    logoUrl: tool?.logoUrl || buildFaviconUrl(launchUrl),
    icon: tool?.icon || DEFAULT_ICON,
    isDefault: Boolean(tool?.isDefault),
    createdAt: Number.isFinite(createdAt) ? createdAt : 0,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
  }
}

export function normalizeCustomStudyTools(items = []) {
  return items
    .map((tool, index) => normalizeStudyTool({ ...tool, isDefault: false }, index))
    .filter((tool) => tool.launchUrl)
}

export function sortStudyTools(tools = []) {
  return [...tools].sort((left, right) => {
    if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1

    const leftUpdated = Number(left.updatedAt || left.createdAt || 0)
    const rightUpdated = Number(right.updatedAt || right.createdAt || 0)
    if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated

    const leftName = String(left.name || left.nameKey || '')
    const rightName = String(right.name || right.nameKey || '')
    return leftName.localeCompare(rightName)
  })
}

export function mergeStudyTools(customTools = []) {
  return sortStudyTools([...DEFAULT_STUDY_TOOLS, ...normalizeCustomStudyTools(customTools)])
}

export const DEFAULT_STUDY_TOOLS = [
  {
    id: 'desmos',
    nameKey: 'toolDesmos',
    descKey: 'toolDesmosDesc',
    icon: 'fa-square-root-variable',
    launchUrl: 'https://www.desmos.com/calculator',
    isDefault: true,
  },
  {
    id: 'geogebra',
    nameKey: 'toolGeoGebra',
    descKey: 'toolGeoGebraDesc',
    icon: 'fa-draw-polygon',
    launchUrl: 'https://www.geogebra.org/classic',
    isDefault: true,
  },
  {
    id: 'phet-area-builder',
    nameKey: 'toolPhET',
    descKey: 'toolPhETDesc',
    icon: 'fa-flask',
    launchUrl: 'https://phet.colorado.edu/sims/html/area-builder/latest/area-builder_all.html',
    isDefault: true,
  },
  {
    id: 'youtube-no-ads',
    nameKey: 'toolYoutubeNoAds',
    descKey: 'toolYoutubeNoAdsDesc',
    icon: 'fa-play',
    launchUrl: 'https://piped.video',
    logoUrl: 'https://piped.video/img/icons/favicon-32x32.png',
    isDefault: true,
  },
  {
    id: 'ruangguru-blog',
    nameKey: 'toolRuangguruBlog',
    descKey: 'toolRuangguruBlogDesc',
    icon: 'fa-book-open-reader',
    launchUrl: 'https://www.ruangguru.com/blog/',
    logoUrl: 'https://cdn-web-2.ruangguru.com/landing-pages/assets/hs/favicon60x60-3.png',
    isDefault: true,
  },
  {
    id: 'quipper-blog',
    nameKey: 'toolQuipperBlog',
    descKey: 'toolQuipperBlogDesc',
    icon: 'fa-school',
    launchUrl: 'https://www.quipper.com/id/blog/',
    logoUrl: 'https://www.quipper.com/id/shared/images/favicons/android-chrome-192x192.png',
    isDefault: true,
  },
  {
    id: 'duolingo-blog',
    nameKey: 'toolDuolingoBlog',
    descKey: 'toolDuolingoBlogDesc',
    icon: 'fa-language',
    launchUrl: 'https://blog.duolingo.com/',
    logoUrl: 'https://storage.ghost.io/c/7a/33/7a33d0f4-927d-4fe8-a6bf-96131b5e76d4/content/images/size/w256h256/2020/03/duolingo-touch-icon2-1.png',
    isDefault: true,
  },
  {
    id: 'codecademy-blog',
    nameKey: 'toolCodecademyBlog',
    descKey: 'toolCodecademyBlogDesc',
    icon: 'fa-code',
    launchUrl: 'https://www.codecademy.com/resources/blog/',
    isDefault: true,
  },
  {
    id: 'notebooklm',
    nameKey: 'toolNotebookLM',
    descKey: 'toolNotebookLMDesc',
    icon: 'fa-brain',
    launchUrl: 'https://notebooklm.google.com',
    isDefault: true,
  },
  {
    id: 'clearnotes',
    nameKey: 'toolClearNotes',
    descKey: 'toolClearNotesDesc',
    icon: 'fa-file-lines',
    launchUrl: 'https://www.clearnotebooks.com/id/notebooks',
    logoUrl: 'https://www.clearnotebooks.com/public/assets/favicon-f76bdb959db1c6b0e0195421e352f06c3425f377e78a8bad0d6e95e033fe00cc.ico',
    isDefault: true,
  },
  {
    id: 'quizlet',
    nameKey: 'toolQuizlet',
    descKey: 'toolQuizletDesc',
    icon: 'fa-layer-group',
    launchUrl: 'https://quizlet.com',
    isDefault: true,
  },
  {
    id: 'bbc-bitesize',
    nameKey: 'toolBBCBitesize',
    descKey: 'toolBBCBitesizeDesc',
    icon: 'fa-newspaper',
    launchUrl: 'https://www.bbc.co.uk/bitesize',
    logoUrl: 'https://static.files.bbci.co.uk/core/website/assets/static/icons/touch/bbc/touch-icon-192.fa493546c3.png',
    isDefault: true,
  },
  {
    id: 'freecodecamp-news',
    nameKey: 'toolFreeCodeCampNews',
    descKey: 'toolFreeCodeCampNewsDesc',
    icon: 'fa-laptop-code',
    launchUrl: 'https://www.freecodecamp.org/news/',
    isDefault: true,
  },
  {
    id: 'coursera',
    nameKey: 'toolCoursera',
    descKey: 'toolCourseraDesc',
    icon: 'fa-graduation-cap',
    launchUrl: 'https://www.coursera.org',
    isDefault: true,
  },
  {
    id: 'canva-design-school',
    nameKey: 'toolCanvaDesignSchool',
    descKey: 'toolCanvaDesignSchoolDesc',
    icon: 'fa-pen-ruler',
    launchUrl: 'https://www.canva.com/designschool/tutorials/',
    isDefault: true,
  },
  {
    id: 'edx',
    nameKey: 'toolEdX',
    descKey: 'toolEdXDesc',
    icon: 'fa-user-graduate',
    launchUrl: 'https://www.edx.org',
    isDefault: true,
  },
].map((tool, index) => normalizeStudyTool(tool, index))
