import { Router } from "express";
import {readFile, writeFile} from 'fs/promises'

//Rutas de usuarios
const file = await readFile('./data/usuarios.json', 'utf-8')
const userData = JSON.parse(file)

const router = Router()

//Get de usuarios
router.get('', (req, res) => {
    res.status(200).json(userData)
})

//Get de usuario por id
router.get('/:id', (req, res) => {
    const user = userData.find(u => u.id === parseInt(req.params.id))
    if (user) {
        res.status(200).json(user)
    } else {
        res.status(404).json({ message: 'Usuario no encontrado' })
    }
})

//Post de usuarios
router.post('', (req, res) => { 
    const { nombre, apellido, email, contraseña } = req.body

    if (!nombre || !apellido || !email || !contraseña) {
        return res.status(400).json({ message: 'Faltan datos obligatorios' })
    }

    try {
        const newUser = {
            id: userData.length > 0 ? Math.max(...userData.map(u => u.id)) + 1 : 1,
            nombre,
            apellido,
            email,
            contraseña,
            ventas_ids: []
        }

        userData.push(newUser)
        writeFile('./data/usuarios.json', JSON.stringify(userData, null, 2))
        res.status(201).json({ message: 'Usuario creado', usuario: newUser })
    }
    catch (error) {
        res.status(500).json({ message: 'Error al crear el usuario' })
    }
})




//Put de usuarios
router.put('/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10)
    const newName = req.body.nombre 
    try {
        const index = userData.findIndex(u => u.id === userId)
        if (index !== -1)
        {
            userData[index].nombre = newName
            writeFile('./data/usuarios.json', JSON.stringify(userData))
            writeFile('./data/usuarios.json', JSON.stringify(userData, null, 2))
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
router.delete('/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10)
    try {
        const hasSales = saleData.some(v => v.id_usuario === userId)
        if (hasSales) {
            return res.status(400).json({ message: 'No se puede eliminar el usuario porque tiene ventas asociadas' })
        }

        const index = userData.findIndex(u => u.id === userId)
        if(index !== -1)
        {
            userData.splice(index, 1)
            writeFile('./data/usuarios.json', JSON.stringify(userData, null, 2))
            res.status(200).json({ message: 'Usuario eliminado' })
        }
        else{
            res.status(400).json({ message: 'Usuario no encontrado' })
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario' })
    }
})

export default router