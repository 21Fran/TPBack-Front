import { readFile } from 'fs/promises'
import { connectToDatabase } from '../connection.js'
import Sale from '../schemas/sale.schema.js'
import User from '../schemas/user.schema.js'
import { getProducts } from './product.actions.js'

const seedFileUrl = new URL('../../data/ventas.json', import.meta.url)

const normalizeSale = (sale) => {
    if (!sale) {
        return null
    }

    const { _id, __v, ...cleanSale } = sale.toObject ? sale.toObject() : sale
    return cleanSale
}

const readSeedSales = async () => {
    const rawSales = await readFile(seedFileUrl, 'utf-8')
    return JSON.parse(rawSales)
}

const seedSalesIfNeeded = async () => {
    const salesCount = await Sale.countDocuments()
    if (salesCount > 0) {
        return
    }

    const seedSales = await readSeedSales()
    if (seedSales.length > 0) {
        await Sale.insertMany(seedSales)
    }
}

const ensureSalesReady = async () => {
    await connectToDatabase()
    await seedSalesIfNeeded()
}

const getAllProductIds = async () => {
    const productsByCategory = await getProducts()
    return new Set(
        Object.values(productsByCategory)
            .flat()
            .map((product) => product.id)
    )
}

export const getSales = async () => {
    await ensureSalesReady()
    const sales = await Sale.find().sort({ id: 1 }).lean()
    return sales.map(normalizeSale)
}

export const getSaleById = async (id) => {
    await ensureSalesReady()
    const sale = await Sale.findOne({ id }).lean()
    return normalizeSale(sale)
}

export const getSalesByUserId = async (userId) => {
    await ensureSalesReady()
    return Sale.countDocuments({ id_usuario: userId })
}

export const createSale = async ({ id_usuario, fecha, total, dirección, productos }) => {
    await ensureSalesReady()

    const userId = Number(id_usuario)
    const parsedTotal = Number(total)
    const productIds = Array.isArray(productos) ? productos.map((item) => Number(item)) : []

    if (!Number.isInteger(userId)) {
        const error = new Error('id_usuario debe ser un numero valido')
        error.statusCode = 400
        throw error
    }

    if (!Number.isFinite(parsedTotal) || parsedTotal < 0) {
        const error = new Error('total debe ser un numero valido mayor o igual a 0')
        error.statusCode = 400
        throw error
    }

    if (productIds.length === 0 || productIds.some((id) => !Number.isInteger(id))) {
        const error = new Error('Productos debe ser un arreglo de IDs de producto')
        error.statusCode = 400
        throw error
    }

    const allProductIds = await getAllProductIds()
    const invalidProducts = productIds.filter((productId) => !allProductIds.has(productId))
    if (invalidProducts.length > 0) {
        const error = new Error('Hay productos que no existen')
        error.statusCode = 400
        error.products = invalidProducts
        throw error
    }

    const user = await User.findOne({ id: userId }).lean()
    if (!user) {
        const error = new Error('Usuario no encontrado para registrar la venta')
        error.statusCode = 400
        throw error
    }

    const highestSale = await Sale.findOne().sort({ id: -1 }).lean()
    const createdSale = await Sale.create({
        id: highestSale ? highestSale.id + 1 : 1,
        id_usuario: userId,
        fecha,
        total: parsedTotal,
        dirección,
        productos: productIds
    })

    await User.updateOne({ id: userId }, { $addToSet: { ventas_ids: createdSale.id } })
    return normalizeSale(createdSale)
}

export const getSalesByDateRange = async (from, to) => {
    await ensureSalesReady()
    const sales = await Sale.find({ fecha: { $gte: from, $lte: to } }).sort({ id: 1 }).lean()
    return sales.map(normalizeSale)
}

export const updateSaleTotal = async (id, total) => {
    await ensureSalesReady()
    const updatedSale = await Sale.findOneAndUpdate(
        { id },
        { $set: { total } },
        { new: true, runValidators: true }
    ).lean()

    return normalizeSale(updatedSale)
}

export const deleteSaleById = async (id) => {
    await ensureSalesReady()
    const sale = await Sale.findOneAndDelete({ id }).lean()

    if (sale) {
        await User.updateOne({ id: sale.id_usuario }, { $pull: { ventas_ids: sale.id } })
    }

    return normalizeSale(sale)
}