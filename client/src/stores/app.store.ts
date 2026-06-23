/**
 * 应用全局状态 (Pinia)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const sidebarCollapsed = ref(false)
  const isDarkMode = ref(false)
  const isLoading = ref(false)

  // Getters
  const sidebarWidth = computed(() => (sidebarCollapsed.value ? '64px' : '220px'))

  // Actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
    if (isDarkMode.value) {
      document.documentElement.setAttribute('arco-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('arco-theme')
    }
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  return {
    sidebarCollapsed,
    isDarkMode,
    isLoading,
    sidebarWidth,
    toggleSidebar,
    setSidebarCollapsed,
    toggleDarkMode,
    setLoading,
  }
})
