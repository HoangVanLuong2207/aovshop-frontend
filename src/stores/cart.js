import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
    state: () => ({
        items: JSON.parse(localStorage.getItem('cart')) || [],
    }),

    getters: {
        itemCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),

        subtotal: (state) => state.items.reduce((sum, item) => {
            const price = item.sale_price || item.price
            return sum + (price * item.quantity)
        }, 0),

        isEmpty: (state) => state.items.length === 0,
    },

    actions: {
        addItem(product, quantity = 1) {
            const existingItem = this.items.find(item => item.id === product.id)
            const isPreorder = product.is_preorder || false
            const availableStock = product.stock || 0

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity
                // Pre-order: no stock limit; instant: limit by available stock
                const safeStock = availableStock > 0 ? availableStock : (existingItem.stock || existingItem.quantity || 1)
                existingItem.quantity = isPreorder ? newQuantity : Math.min(Math.max(1, newQuantity), safeStock)
                if (!isPreorder) {
                    existingItem.stock = safeStock
                }
                existingItem.is_preorder = isPreorder
            } else {
                const safeInitialQuantity = isPreorder ? Math.max(1, quantity) : Math.max(1, Math.min(quantity, availableStock || 1))
                this.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    sale_price: product.sale_price,
                    image: product.image,
                    quantity: safeInitialQuantity,
                    stock: isPreorder ? 0 : (availableStock || 1),
                    is_preorder: isPreorder,
                    preorder_placeholder: product.preorder_placeholder,
                })
            }

            this.saveToStorage()
        },

        updateQuantity(productId, quantity, stock) {
            const item = this.items.find(item => item.id === productId)
            if (item) {
                if (item.is_preorder) {
                    item.quantity = Math.max(1, quantity)
                    this.saveToStorage()
                    return
                }
                const requestedStock = stock !== undefined ? Number(stock) : Number(item.stock)
                const safeStock = Number.isFinite(requestedStock) && requestedStock > 0
                    ? requestedStock
                    : Math.max(1, Number(item.quantity) || 1)
                item.quantity = Math.min(Math.max(1, quantity), safeStock)
                item.stock = safeStock
                this.saveToStorage()
            }
        },

        removeItem(productId) {
            this.items = this.items.filter(item => item.id !== productId)
            this.saveToStorage()
        },

        clearCart() {
            this.items = []
            this.saveToStorage()
        },

        saveToStorage() {
            localStorage.setItem('cart', JSON.stringify(this.items))
        },

        getCheckoutItems() {
            return this.items.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
            }))
        },
    },
})
