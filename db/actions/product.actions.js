import { readFile } from 'fs/promises'
import { connectToDatabase } from '../connection.js'
import Product from '../schemas/product.schema.js'

const seedFileUrl = new URL('../../data/productos.json', import.meta.url)

const normalizeProduct = (product) => {
    const { _id, __v, ...cleanProduct } = product.toObject ? product.toObject() : product
    return cleanProduct
}

const groupProductsByCategory = (products) => {
    return products.reduce((accumulator, product) => {
        if (!accumulator[product.categoria]) {
            accumulator[product.categoria] = []
        }

        accumulator[product.categoria].push(normalizeProduct(product))
        return accumulator
    }, {})
}

const readSeedProducts = async () => {
    const rawProducts = await readFile(seedFileUrl, 'utf-8')
    const categories = JSON.parse(rawProducts)

    return Object.entries(categories).flatMap(([categoria, products]) => {
        return products.map((product) => ({ ...product, categoria }))
    })
}

const seedProductsIfNeeded = async () => {
    const productsCount = await Product.countDocuments()

    if (productsCount > 0) {
        return
    }

    const seedProducts = await readSeedProducts()

    if (seedProducts.length > 0) {
        await Product.insertMany(seedProducts)
    }
}

const ensureProductsReady = async () => {
    await connectToDatabase()
    await seedProductsIfNeeded()
}

export const getProducts = async () => {
    await ensureProductsReady()
    const products = await Product.find().sort({ categoria: 1, id: 1 }).lean()

    return groupProductsByCategory(products)
}

export const getProductById = async (id) => {
    await ensureProductsReady()
    const product = await Product.findOne({ id }).lean()

    return product ? product : null
}

export const createProduct = async (productData) => {
    await ensureProductsReady()
    const highestProduct = await Product.findOne().sort({ id: -1 }).lean()
    const newProduct = await Product.create({
        id: highestProduct ? highestProduct.id + 1 : 1,
        ...productData
    })

    return normalizeProduct(newProduct)
}

export const updateProduct = async (id, productData) => {
    await ensureProductsReady()
    const updateFields = Object.fromEntries(
        Object.entries(productData).filter(([, value]) => value !== undefined)
    )

    if (Object.keys(updateFields).length === 0) {
        return null
    }

    const updatedProduct = await Product.findOneAndUpdate(
        { id },
        { $set: updateFields },
        { new: true, runValidators: true }
    ).lean()

    return updatedProduct ? updatedProduct : null
}

export const deleteProduct = async (id) => {
    await ensureProductsReady()
    const deletedProduct = await Product.findOneAndDelete({ id }).lean()

    return deletedProduct ? deletedProduct : null
}

export const createProd = createProduct