import { Router } from "express";
import {
    createProduct,
    deleteProduct,
    getProductById,
    getProducts,
    updateProduct
} from '../db/actions/product.actions.js'

//Rutas de productos
const router = Router()

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0



//Get de productos
router.get('', async (req, res) => {
    try {
        const products = await getProducts()
        res.status(200).json(products)
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos' })
    }
})

//Get de producto por id
router.get('/:id', async (req, res) => {
    const productId = parseInt(req.params.id, 10)
    if (Number.isNaN(productId)) {
        return res.status(400).json({ message: 'Id de producto invalido' })
    }

    try {
        const product = await getProductById(productId)

        if (product) {
            res.status(200).json(product)
        } else {
            res.status(404).json({ message: 'Producto no encontrado' })
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto' })
    }
})

//Post de productos
router.post('', async (req, res) => {
    const { categoria, nombre, desc, precio, imagen, en_oferta } = req.body
    if (!categoria || !nombre || !desc || precio === undefined || !imagen || en_oferta === undefined) {
        return res.status(400).json({ message: 'Faltan datos obligatorios' })
    }

    if (!isNonEmptyString(categoria) || !isNonEmptyString(nombre) || !isNonEmptyString(desc) || !isNonEmptyString(imagen)) {
        return res.status(400).json({ message: 'categoria, nombre, desc e imagen deben ser texto no vacio' })
    }

    if (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0) {
        return res.status(400).json({ message: 'precio debe ser un numero valido mayor o igual a 0' })
    }

    if (typeof en_oferta !== 'boolean') {
        return res.status(400).json({ message: 'en_oferta debe ser booleano' })
    }

    try {
        const newProduct = await createProduct({ categoria, nombre, desc, precio, imagen, en_oferta })
        res.status(201).json({ message: 'Producto creado', producto: newProduct })
    }
    catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'El producto ya existe' })
        }

        res.status(500).json({ message: 'Error al crear el producto' })
    }
})

//Post de producto mayor a 100
router.post('/detail', async (req, res) => {
    const from = Number(req.body.from)
    const to = Number(req.body.to)

    if (!Number.isFinite(from) || !Number.isFinite(to)) {
        return res.status(400).json({ message: 'from y to deben ser numeros validos' })
    }

    try {
        const products = await getProducts()
        const filteredProducts = Object.fromEntries(
            Object.entries(products).map(([categoria, items]) => [
                categoria,
                items.filter((product) => product.precio >= from && product.precio <= to)
            ]).filter(([, items]) => items.length > 0)
        )

        res.status(200).json(filteredProducts)
    }
    catch (error) {
        res.status(500).json({ message: 'Error al filtrar los productos' })
    }
})


//Put de productos
router.put('/:id', async (req, res) => {
    const productId = parseInt(req.params.id, 10)
    if (Number.isNaN(productId)) {
        return res.status(400).json({ message: 'Id de producto invalido' })
    }

    const { categoria, nombre, desc, precio, imagen, en_oferta } = req.body

    if (
        categoria !== undefined && !isNonEmptyString(categoria) ||
        nombre !== undefined && !isNonEmptyString(nombre) ||
        desc !== undefined && !isNonEmptyString(desc) ||
        imagen !== undefined && !isNonEmptyString(imagen)
    ) {
        return res.status(400).json({ message: 'Los campos de texto deben ser texto no vacio' })
    }

    if (precio !== undefined && (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0)) {
        return res.status(400).json({ message: 'precio debe ser un numero valido mayor o igual a 0' })
    }

    if (en_oferta !== undefined && typeof en_oferta !== 'boolean') {
        return res.status(400).json({ message: 'en_oferta debe ser booleano' })
    }

    if (
        categoria === undefined &&
        nombre === undefined &&
        desc === undefined &&
        precio === undefined &&
        imagen === undefined &&
        en_oferta === undefined
    ) {
        return res.status(400).json({ message: 'No se enviaron datos para actualizar' })
    }

    try {
        const updatedProduct = await updateProduct(productId, { categoria, nombre, desc, precio, imagen, en_oferta })

        if (updatedProduct) {
            res.status(200).json({ message: 'Producto actualizado' })
        } else {
            res.status(400).json({ message: 'Producto no encontrado' })
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error al actualizar el producto' })
    }
})

//Delete de productos
router.delete('/:id', async (req, res) => {
    const productId = parseInt(req.params.id, 10)
    if (Number.isNaN(productId)) {
        return res.status(400).json({ message: 'Id de producto invalido' })
    }

    try {
        const deletedProduct = await deleteProduct(productId)

        if (deletedProduct) {
            res.status(200).json({ message: 'Producto eliminado' })
        } else {
            res.status(400).json({ message: 'Producto no encontrado' })
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar el producto' })
    }
})

export default router