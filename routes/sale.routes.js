import { Router } from "express";
import { get_user_by_id } from "../utils/user.js";
import {
    createSale,
    deleteSaleById,
    getSaleById,
    getSales,
    getSalesByDateRange,
    updateSaleTotal
} from '../db/actions/sale.actions.js'

const router = Router()

//Get de ventas
router.get('', async (req, res) => {
    try {
        const sales = await getSales()
        res.status(200).json(sales)
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener las ventas' })
    }
})

//Get de venta por id
router.get('/:id', async (req, res) => {
    const saleId = parseInt(req.params.id, 10)

    if (Number.isNaN(saleId)) {
        return res.status(400).json({ message: 'ID de venta invalido' })
    }

    try {
        const sale = await getSaleById(saleId)
        if (sale) {
            res.status(200).json(sale)
        } else {
            res.status(404).json({ message: 'Venta no encontrada' })
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la venta' })
    }
})

//Post de ventas
router.post('', async (req, res) => {
    const { id_usuario, fecha, total, dirección, productos } = req.body

    if (id_usuario === undefined || !fecha || total === undefined || !dirección || productos === undefined) {
        return res.status(400).json({ message: 'Faltan datos obligatorios' })
    }

    try {
        const newSale = await createSale({ id_usuario, fecha, total, dirección, productos })
        res.status(201).json({ message: 'Venta creada', venta: newSale })
    }
    catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({
                message: error.message,
                productos_invalidos: error.products || undefined
            })
        }

        res.status(500).json({ message: 'Error al crear la venta' })
    }
})

//Post de venta desde y hasta
router.post('/detail', async (req, res) => {
    const from = req.body.from
    const to = req.body.to

    if (!from || !to) {
        return res.status(400).json({ message: 'Debe enviar from y to para filtrar por rango de fechas' })
    }

    try {
        const sales = await getSalesByDateRange(from, to)
        const result = []

        for (const sale of sales) {
            const user = await get_user_by_id(sale.id_usuario)
            const userName = user ? `${user.nombre} ${user.apellido}` : 'Usuario no encontrado'
            result.push({
                idSale: sale.id,
                idUser: userName,
                date: sale.fecha,
                total: sale.total
            })
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'No se encontraron ventas en ese rango de fechas' })
        }

        res.status(200).json({
            message: 'Detalle de ventas filtrado por rango de fechas',
            filtro: { from, to },
            ventas: result
        })
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener las ventas' })
    }

})

//Put de ventas
router.put('/:id', async (req, res) => {
    const saleId = parseInt(req.params.id, 10)
    const newTotal = req.body.total

    if (Number.isNaN(saleId)) {
        return res.status(400).json({ message: 'ID de venta invalido' })
    }

    if (newTotal === undefined || !Number.isFinite(Number(newTotal)) || Number(newTotal) < 0) {
        return res.status(400).json({ message: 'total debe ser un numero valido mayor o igual a 0' })
    }

    try {
        const updatedSale = await updateSaleTotal(saleId, Number(newTotal))
        if (updatedSale) {
            res.status(200).json({ message: 'Venta actualizada' })
        } else {
            res.status(400).json({ message: 'Venta no encontrada' })
        }
    }
    catch (error)
    {
        res.status(500).json({ message: 'Error al actualizar la venta' })
    }
})


//Delete de ventas
router.delete('/:id', async (req, res) => {
    const saleId = parseInt(req.params.id, 10)
    try {
        const deletedSale = await deleteSaleById(saleId)

        if(deletedSale)
        {
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
