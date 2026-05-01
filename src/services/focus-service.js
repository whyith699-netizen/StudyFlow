/**
 * Focus Service - Handles Site Blocking
 * Uses chrome.declarativeNetRequest to block distracting sites during study sessions
 */

// Default distracting sites
const DEFAULT_BLOCKLIST = [
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'youtube.com',
  'netflix.com',
  'reddit.com',
  'twitch.tv',
  'pinterest.com',
  'discord.com'
]

// Rule ID range for blocking (1-1000 reserved for this)
const RULE_ID_START = 1

export const focusService = {
  /**
   * Enable Focus Mode - Block sites
   */
  async enableFocusMode(customBlocklist = []) {
    const sites = customBlocklist.length > 0 ? customBlocklist : DEFAULT_BLOCKLIST
    
    // Create rules
    const rules = sites.map((domain, index) => ({
      id: RULE_ID_START + index,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: ['main_frame']
      }
    }))

    // Update dynamic rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id), // Remove existing to avoid duplicates
      addRules: rules
    })

    console.log('[Focus] Enabled. Blocking:', sites)
    await this.setFocusState(true)
  },

  /**
   * Disable Focus Mode - Unblock sites
   */
  async disableFocusMode() {
    // Get all current dynamic rules to remove them
    const rules = await chrome.declarativeNetRequest.getDynamicRules()
    const ruleIds = rules.map(r => r.id).filter(id => id >= RULE_ID_START && id < RULE_ID_START + 1000)

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds
    })

    console.log('[Focus] Disabled.')
    await this.setFocusState(false)
  },

  /**
   * Save state locally
   */
  async setFocusState(isEnabled) {
    await chrome.storage.local.set({ focusModeEnabled: isEnabled })
  },

  /**
   * Get current state
   */
  async getFocusState() {
    const result = await chrome.storage.local.get(['focusModeEnabled'])
    return result.focusModeEnabled || false
  }
}
