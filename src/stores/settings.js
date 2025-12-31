import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const useSettingsStore = defineStore('settings', () => {
    const shopName = ref('AOV Shop')
    const shopLogo = ref(null)
    const shopBanner = ref(null)
    const loaded = ref(false)

    const fetchShopInfo = async () => {
        if (loaded.value) return

        try {
            const response = await api.get('/shop/info')
            shopName.value = response.data.shop_name || 'AOV Shop'
            shopLogo.value = response.data.shop_logo
            shopBanner.value = response.data.shop_banner
            loaded.value = true
        } catch (error) {
            console.error('Failed to fetch shop info:', error)
        }
    }

    return {
        shopName,
        shopLogo,
        shopBanner,
        loaded,
        fetchShopInfo,
    }
})
