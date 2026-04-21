import { Router } from "express";
import {readFile, writeFile} from 'fs/promises'


//Rutas de productos
const fileProductos = await readFile('./data/productos.json', 'utf-8')
const productData = JSON.parse(fileProductos)

const router = Router()



//Get de productos
router.get('', (req, res) => {
    res.status(200).json(productData)
})

//Get de producto por id
router.get('/:id', (req, res) => {
    const productId = parseInt(req.params.id, 10)
    let product = null

    for (const categoria in productData) {
        const foundProduct = productData[categoria].find(p => p.id === productId)
        if (foundProduct) {
            product = foundProduct
            break
        }
    }

    if (product) {
        res.status(200).json(product)
    } else {
        res.status(404).json({ message: 'Producto no encontrado' })
    }
})

//Post de productos
router.post('', (req, res) => {
    const { categoria, nombre, desc, precio, imagen, en_oferta } = req.body

    if (!categoria || !nombre || !desc || precio === undefined || !imagen || en_oferta === undefined) {
        return res.status(400).json({ message: 'Faltan datos obligatorios' })
    }

    try {
        if (!productData[categoria]) {
            return res.status(400).json({ message: 'Categoria no encontrada' })
        }

        const allProducts = Object.values(productData).flat()
        const newProduct = {
            id: allProducts.length > 0 ? Math.max(...allProducts.map(p => p.id)) + 1 : 1,
            nombre,
            desc,
            precio,
            imagen,
            en_oferta
        }

        productData[categoria].push(newProduct)
        writeFile('./data/productos.json', JSON.stringify(productData, null, 2))
        res.status(201).json({ message: 'Producto creado', producto: newProduct })
    }
    catch (error) {
        res.status(500).json({ message: 'Error al crear el producto' })
    }
})

//Post de producto mayor a 100
router.post('/detail', (req, res) => {
    const from = req.body.from
    const to = req.body.to
})


//Put de productos
router.put('/:id', (req, res) => {
    const productId = parseInt(req.params.id, 10)
    const newName = req.body.nombre
    try {
        let updated = false

        for (const categoria in productData) {
            const index = productData[categoria].findIndex(p => p.id === productId)
            if (index !== -1)
            {
                productData[categoria][index].nombre = newName
                writeFile('./data/productos.json', JSON.stringify(productData, null, 2))
                updated = true
                break
            }
        }

        if (updated)
        {
            res.status(200).json({ message: 'Producto actualizado' })
        }
        else
            {
            res.status(400).json({ message: 'Producto no encontrado' })
            }
    }
    catch (error)
    {
        res.status(500).json({ message: 'Error al actualizar el producto' })
    }
})

//Delete de productos
router.delete('/:id', (req, res) => {
    const productId = parseInt(req.params.id, 10)
    try {
        let deleted = false

        for (const categoria in productData) {
            const index = productData[categoria].findIndex(p => p.id === productId)
            if(index !== -1)
            {
                productData[categoria].splice(index, 1)
                writeFile('./data/productos.json', JSON.stringify(productData, null, 2))
                deleted = true
                break
            }
        }

        if (deleted)
        {
            res.status(200).json({ message: 'Producto eliminado' })
        }
        else{
            res.status(400).json({ message: 'Producto no encontrado' })
        }
    }
    catch (error)    {
        res.status(500).json({ message: 'Error al eliminar el producto' })
    }
})

export default router