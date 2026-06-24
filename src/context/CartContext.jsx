import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useCustomerAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const { user } = useCustomerAuth()

  useEffect(() => {
    if (user) {
      loadCart()
    } else {
      // Load from local storage for guests
      const savedCart = localStorage.getItem('lazar_cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
      setLoading(false)
    }
  }, [user])

  async function loadCart() {
    if (!user) return

    try {
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (cartError && cartError.code !== 'PGRST116') {
        throw cartError
      }

      if (!cartData) {
        // Create new cart
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select()
          .single()

        if (createError) throw createError
        setCart({ id: newCart.id, items: [], total: 0 })
      } else {
        // Load cart items
        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            product_id,
            products ( id, name, price, image_urls, stock_quantity )
          `)
          .eq('cart_id', cartData.id)

        if (itemsError) throw itemsError

        const formattedItems = items?.map(item => ({
          id: item.id,
          productId: item.product_id,
          name: item.products.name,
          price: item.products.price,
          image: item.products.image_urls?.[0] || '',
          quantity: item.quantity,
          stock: item.products.stock_quantity
        })) || []

        const total = formattedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        setCart({ id: cartData.id, items: formattedItems, total })
      }
    } catch (error) {
      console.error('Load cart error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addToCart(product, quantity = 1) {
    if (user) {
      return await addToDbCart(product, quantity)
    } else {
      return addToLocalCart(product, quantity)
    }
  }

  async function addToDbCart(product, quantity) {
    try {
      let cartId = cart.id

      if (!cartId) {
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select()
          .single()

        if (createError) throw createError
        cartId = newCart.id
      }

      const existingItem = cart.items.find(item => item.productId === product.id)

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity
        if (newQuantity > product.stock_quantity) {
          return { success: false, error: 'Not enough stock' }
        }

        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: product.id,
            quantity
          })

        if (insertError) throw insertError
      }

      await loadCart()
      return { success: true }
    } catch (error) {
      console.error('Add to cart error:', error)
      return { success: false, error: 'Failed to add to cart' }
    }
  }

  function addToLocalCart(product, quantity) {
    const items = [...cart.items]
    const existingIndex = items.findIndex(item => item.productId === product.id)

    if (existingIndex > -1) {
      const newQuantity = items[existingIndex].quantity + quantity
      if (newQuantity > product.stock_quantity) {
        return { success: false, error: 'Not enough stock' }
      }
      items[existingIndex].quantity = newQuantity
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image_urls?.[0] || '',
        quantity,
        stock: product.stock_quantity
      })
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const newCart = { items, total }
    setCart(newCart)
    localStorage.setItem('lazar_cart', JSON.stringify(newCart))
    return { success: true }
  }

  async function updateCartItem(itemId, quantity) {
    if (quantity < 1) {
      return removeFromCart(itemId)
    }

    if (user) {
      const item = cart.items.find(i => i.id === itemId)
      if (item && quantity > item.stock) {
        return { success: false, error: 'Not enough stock' }
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)

      if (error) {
        return { success: false, error: 'Failed to update' }
      }

      await loadCart()
      return { success: true }
    } else {
      const items = cart.items.map(item => {
        if (item.productId === itemId) {
          if (quantity > item.stock) {
            throw new Error('Not enough stock')
          }
          return { ...item, quantity }
        }
        return item
      })

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const newCart = { items, total }
      setCart(newCart)
      localStorage.setItem('lazar_cart', JSON.stringify(newCart))
      return { success: true }
    }
  }

  async function removeFromCart(itemId) {
    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        return { success: false, error: 'Failed to remove' }
      }

      await loadCart()
      return { success: true }
    } else {
      const items = cart.items.filter(item => item.productId !== itemId)
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const newCart = { items, total }
      setCart(newCart)
      localStorage.setItem('lazar_cart', JSON.stringify(newCart))
      return { success: true }
    }
  }

  async function clearCart() {
    if (user && cart.id) {
      await supabase.from('cart_items').delete().eq('cart_id', cart.id)
    }
    setCart({ items: [], total: 0 })
    localStorage.removeItem('lazar_cart')
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      itemCount,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
