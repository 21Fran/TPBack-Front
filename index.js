import express from 'express'
import {readFile, writeFile} from 'fs/promises'

import userRoutes from './routes/user.routes.js'
import productRoutes from './routes/product.routes.js'
import saleRoutes from './routes/sale.routes.js'

//Crear instancia de app
const app = express()

//Configurar puerto
const port = 3000

//Levantar el servidor
app.use(express.json())

app.listen(port, () => {
    console.log(`Servidor levantado en puerto ${port}`)
})

//Rutas de Endpoints
//Route de usuarios
app.use('/usuarios', userRoutes)

//Route de productos
app.use('/productos', productRoutes)

//Route de ventas
app.use('/ventas', saleRoutes)

//Levantar FrontEnd
app.use(express.static('./public'))





