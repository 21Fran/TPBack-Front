import {readFile, writeFile} from 'fs/promises'


//Rutas de usuarios
const file = await readFile('./data/usuarios.json', 'utf-8')
const userData = JSON.parse(file)

export const get_user_by_id = (id) => {
    return userData.find(u => u.id === id)
}