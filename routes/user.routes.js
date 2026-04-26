import { Router } from "express";
import { readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const usersFilePath = join(__dirname, '../data/usuarios.json')
const salesFilePath = join(__dirname, '../data/ventas.json')

//Rutas de usuarios
const file = await readFile(usersFilePath, 'utf-8')
const userData = JSON.parse(file)

const saveUsers = () => writeFile(usersFilePath, JSON.stringify(userData, null, 2))

const getSalesData = async () => {
    const refreshedSales = await readFile(salesFilePath, 'utf-8')
    return JSON.parse(refreshedSales)
}

const sanitizeUser = (user) => {
    if (!user) {
        return null
    }

    const { contraseña, ...safeUser } = user
    return safeUser
}

const router = Router()

//Get de usuarios
router.get('/', (req, res) => {
    res.status(200).json(userData)
})

//Get de usuario por id
router.get('/:id', (req, res) => {
    const user = userData.find(u => u.id === parseInt(req.params.id))
    if (user) {
        res.status(200).json(sanitizeUser(user))
    } else {
        res.status(404).json({ message: 'Usuario no encontrado' })
    }
})

//Login de usuarios
router.post('/login', (req, res) => {
    const { email, contraseña, password } = req.body
    const inputPassword = contraseña ?? password

    if (!email || !inputPassword) {
        return res.status(400).json({ message: 'Faltan datos obligatorios' })
    }

    const user = userData.find(u => u.email.toLowerCase() === email.toLowerCase() && u.contraseña === inputPassword)

    if (!user) {
        return res.status(401).json({ message: 'Email o contraseña incorrectos' })
    }

    res.status(200).json({ message: 'Inicio de sesión exitoso', usuario: sanitizeUser(user) })
})

//Post de usuarios
router.post('/', async (req, res) => { 
    const { nombre, apellido, email, contraseña, fecha_nacimiento, fecha } = req.body

    if (!nombre || !apellido || !email || !contraseña) {
        return res.status(400).json({ message: 'Faltan datos obligatorios' })
    }

    const emailExists = userData.some(u => u.email.toLowerCase() === email.toLowerCase())
    if (emailExists) {
        return res.status(409).json({ message: 'Este email ya está registrado' })
    }

    try {
        const newUser = {
            id: userData.length > 0 ? Math.max(...userData.map(u => u.id)) + 1 : 1,
            nombre,
            apellido,
            email,
            contraseña,
            fecha_nacimiento: fecha_nacimiento ?? fecha ?? null,
            ventas_ids: []
        }

        userData.push(newUser)
        await saveUsers()
        res.status(201).json({ message: 'Usuario creado', usuario: sanitizeUser(newUser) })
    }
    catch (error) {
        res.status(500).json({ message: 'Error al crear el usuario' })
    }
})




//Put de usuarios
router.put('/:id', async (req, res) => {
    const userId = parseInt(req.params.id, 10)
    const newName = req.body.nombre 
    try {
        const index = userData.findIndex(u => u.id === userId)
        if (index !== -1)
        {
            userData[index].nombre = newName
            await saveUsers()
            res.status(200).json({ message: 'Usuario actualizado' })
        }
        else
            {
            res.status(400).json({ message: 'Usuario no encontrado' })
            }
    }
    catch (error) 
    {        
        res.status(500).json({ message: 'Error al actualizar el usuario' })
    }
})

//Delete de usuarios con la validacion de que no tenga ventas asociadas
router.delete('/:id', async (req, res) => {
    const userId = parseInt(req.params.id, 10)

    if (Number.isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario invalido' })
    }

    try {
        const index = userData.findIndex(u => u.id === userId)
        if (index === -1) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        const currentSales = await getSalesData()
        const hasSales = currentSales.some(v => v.id_usuario === userId)
        if (hasSales) {
            return res.status(409).json({ message: 'No se puede eliminar el usuario porque tiene ventas asociadas' })
        }

        userData.splice(index, 1)
        await saveUsers()
        res.status(200).json({ message: 'Usuario eliminado' })
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario' })
    }
})

export default router