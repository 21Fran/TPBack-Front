import { Router } from "express";
import {
    createUser,
    deleteUserById,
    findUserByCredentials,
    getUserById,
    getUsers,
    updateUserName
} from '../db/actions/user.actions.js'
import { getSalesByUserId } from '../db/actions/sale.actions.js'

const router = Router()

//Get de usuarios
router.get('/', async (req, res) => {
    try {
        const users = await getUsers()
        res.status(200).json(users)
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios' })
    }
})

//Get de usuario por id
router.get('/:id', async (req, res) => {
    const userId = parseInt(req.params.id, 10)

    if (Number.isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario invalido' })
    }

    try {
        const user = await getUserById(userId)
        if (user) {
            res.status(200).json(user)
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' })
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el usuario' })
    }
})

//Login de usuarios
router.post('/login', async (req, res) => {
    const { email, contraseña, password } = req.body
    const inputPassword = contraseña ?? password

    if (!email || !inputPassword) {
        return res.status(400).json({ message: 'Faltan datos obligatorios' })
    }

    try {
        const user = await findUserByCredentials(email, inputPassword)

        if (!user) {
            return res.status(401).json({ message: 'Email o contraseña incorrectos' })
        }

        res.status(200).json({ message: 'Inicio de sesión exitoso', usuario: user })
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión' })
    }
})

//Post de usuarios
router.post('/', async (req, res) => { 
    const { nombre, apellido, email, contraseña, fecha_nacimiento, fecha } = req.body

    if (!nombre || !apellido || !email || !contraseña) {
        return res.status(400).json({ message: 'Faltan datos obligatorios' })
    }

    try {
        const newUser = await createUser({
            nombre,
            apellido,
            email,
            contraseña,
            fecha_nacimiento: fecha_nacimiento ?? fecha ?? null
        })

        res.status(201).json({ message: 'Usuario creado', usuario: newUser })
    }
    catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ message: error.message })
        }

        res.status(500).json({ message: 'Error al crear el usuario' })
    }
})




//Put de usuarios
router.put('/:id', async (req, res) => {
    const userId = parseInt(req.params.id, 10)
    const newName = req.body.nombre 

    if (Number.isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario invalido' })
    }

    if (!newName || typeof newName !== 'string' || !newName.trim()) {
        return res.status(400).json({ message: 'nombre debe ser un texto no vacio' })
    }

    try {
        const updatedUser = await updateUserName(userId, newName.trim())

        if (updatedUser) {
            res.status(200).json({ message: 'Usuario actualizado' })
        } else {
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
        const user = await getUserById(userId)
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        const hasSales = await getSalesByUserId(userId)
        if (hasSales) {
            return res.status(409).json({ message: 'No se puede eliminar el usuario porque tiene ventas asociadas' })
        }

        await deleteUserById(userId)
        res.status(200).json({ message: 'Usuario eliminado' })
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario' })
    }
})

export default router