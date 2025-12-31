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
            const availableStock = product.stock || 0

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity
                existingItem.quantity = Math.min(newQuantity, availableStock)
                existingItem.stock = availableStock // Update stock info
            } else {
                this.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    sale_price: product.sale_price,
                    image: product.image,
                    quantity: Math.min(quantity, availableStock),
                    stock: availableStock,
                })
            }

            this.saveToStorage()
        },

        updateQuantity(productId, quantity, stock) {
            const item = this.items.find(item => item.id === productId)
            if (item) {
                const availableStock = stock !== undefined ? stock : (item.stock || 0)
                item.quantity = Math.min(Math.max(1, quantity), availableStock)
                if (stock !== undefined) item.stock = stock
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
