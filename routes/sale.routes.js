import { Router } from "express";
import {readFile, writeFile} from 'fs/promises'
import { get_user_by_id } from "../utils/user.js";

const router = Router()

//Rutas de ventas
const fileVentas = await readFile('./data/ventas.json', 'utf-8')
const saleData = JSON.parse(fileVentas)
const fileUsers = await readFile('./data/usuarios.json', 'utf-8')
const userData = JSON.parse(fileUsers)

const normalizeProductIds = (productos) => {
    if (!Array.isArray(productos)) {
        return null
    }

    const ids = productos.map((item) => {
        if (typeof item === 'number' || typeof item === 'string') {
            return parseInt(item, 10)
        }

        if (item && typeof item === 'object') {
            return parseInt(item.id, 10)
        }

        return NaN
    })

    if (ids.some(id => Number.isNaN(id))) {
        return null
    }

    return ids
}

let salesWereNormalized = false
saleData.forEach((sale) => {
    const normalizedProducts = normalizeProductIds(sale.productos)
    if (!normalizedProducts) {
        return
    }

    if (JSON.stringify(sale.productos) !== JSON.stringify(normalizedProducts)) {
        sale.productos = normalizedProducts
        salesWereNormalized = true
    }
})

if (salesWereNormalized) {
    await writeFile('./data/ventas.json', JSON.stringify(saleData, null, 2))
}

//Get de ventas
router.get('', (req, res) => {
    res.status(200).json(saleData)
})

//Get de venta por id
router.get('/:id', (req, res) => {
    const sale = saleData.find(v => v.id === parseInt(req.params.id))
    if (sale) {
        res.status(200).json(sale)
    } else {
        res.status(404).json({ message: 'Venta no encontrada' })
    }
})

//Post de ventas
router.post('', (req, res) => {
    const { id_usuario, fecha, total, dirección, productos } = req.body

    if (id_usuario === undefined || !fecha || total === undefined || !dirección || productos === undefined) {
        return res.status(400).json({ message: 'Faltan datos obligatorios' })
    }

    try {
        const userId = parseInt(id_usuario, 10)
        const normalizedProducts = normalizeProductIds(productos)

        if (!normalizedProducts || normalizedProducts.length === 0) {
            return res.status(400).json({ message: 'Productos debe ser un arreglo de IDs de producto' })
        }

        const userIndex = userData.findIndex(u => u.id === userId)
        if (userIndex === -1) {
            return res.status(400).json({ message: 'Usuario no encontrado para registrar la venta' })
        }

        const newSale = {
            id: saleData.length > 0 ? Math.max(...saleData.map(v => v.id)) + 1 : 1,
            id_usuario: userId,
            fecha,
            total,
            dirección,
            productos: normalizedProducts
        }

        saleData.push(newSale)
        if (!Array.isArray(userData[userIndex].ventas_ids)) {
            userData[userIndex].ventas_ids = []
        }
        userData[userIndex].ventas_ids.push(newSale.id)
        writeFile('./data/ventas.json', JSON.stringify(saleData, null, 2))
        writeFile('./data/usuarios.json', JSON.stringify(userData, null, 2))
        res.status(201).json({ message: 'Venta creada', venta: newSale })
    }
    catch (error) {
        res.status(500).json({ message: 'Error al crear la venta' })
    }
})

//Post de venta desde y hasta
router.post('/detail', (req, res) => {
    const from = req.body.from
    const to = req.body.to
    let aux_name = ''
    try {
        const array = saleData.filter(v => v.fecha >= from && v.fecha <= to)
        const result = array.map(v => {
            aux_name = get_user_by_id(v.id_usuario)
            aux_name = aux_name ? `${aux_name.nombre} ${aux_name.apellido}` : 'Usuario no encontrado'
            return{
            idSale : v.id,
            idUser : aux_name,
            date : v.fecha,
            total : v.total,
            }
        })
        if(result)
        {
            res.status(200).json(result)
        }
        else{
            res.status(400).json({ message: 'No se encontraron ventas en ese rango de fechas' })
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener las ventas' })
    }

})

//Put de ventas
router.put('/:id', (req, res) => {
    const saleId = parseInt(req.params.id, 10)
    const newTotal = req.body.total
    try {
        const index = saleData.findIndex(v => v.id === saleId)
        if (index !== -1)
        {
            saleData[index].total = newTotal
            writeFile('./data/ventas.json', JSON.stringify(saleData, null, 2))
            res.status(200).json({ message: 'Venta actualizada' })
        }
        else
            {
            res.status(400).json({ message: 'Venta no encontrada' })
            }
    }
    catch (error)
    {
        res.status(500).json({ message: 'Error al actualizar la venta' })
    }
})


//Delete de ventas
router.delete('/:id', (req, res) => {
    const saleId = parseInt(req.params.id, 10)
    try {
        const index = saleData.findIndex(v => v.id === saleId)
        if(index !== -1)
        {
            const sale = saleData[index]
            saleData.splice(index, 1)

            const userIndex = userData.findIndex(u => u.id === sale.id_usuario)
            if (userIndex !== -1 && Array.isArray(userData[userIndex].ventas_ids)) {
                userData[userIndex].ventas_ids = userData[userIndex].ventas_ids.filter(id => id !== saleId)
            }

            writeFile('./data/ventas.json', JSON.stringify(saleData, null, 2))
            writeFile('./data/usuarios.json', JSON.stringify(userData, null, 2))
            res.status(200).json({ message: 'Venta eliminada' })
        }
        else{
            res.status(400).json({ message: 'Venta no encontrada' })
        }
    }
    catch (error)    {
        res.status(500).json({ message: 'Error al eliminar la venta' })
    }
})

export default router
