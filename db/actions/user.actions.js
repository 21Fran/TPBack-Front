import { readFile } from 'fs/promises'
import { connectToDatabase } from '../connection.js'
import User from '../schemas/user.schema.js'

const seedFileUrl = new URL('../../data/usuarios.json', import.meta.url)

const normalizeUser = (user) => {
    if (!user) {
        return null
    }

    const { _id, __v, contraseña, ...safeUser } = user.toObject ? user.toObject() : user
    return safeUser
}

const readSeedUsers = async () => {
    const rawUsers = await readFile(seedFileUrl, 'utf-8')
    return JSON.parse(rawUsers)
}

const seedUsersIfNeeded = async () => {
    const usersCount = await User.countDocuments()
    if (usersCount > 0) {
        return
    }

    const seedUsers = await readSeedUsers()
    if (seedUsers.length > 0) {
        await User.insertMany(seedUsers.map((user) => ({ ...user, email: String(user.email || '').toLowerCase() })))
    }
}

const ensureUsersReady = async () => {
    await connectToDatabase()
    await seedUsersIfNeeded()
}

export const getUsers = async () => {
    await ensureUsersReady()
    const users = await User.find().sort({ id: 1 }).lean()
    return users.map(normalizeUser)
}

export const getUserById = async (id) => {
    await ensureUsersReady()
    const user = await User.findOne({ id }).lean()
    return normalizeUser(user)
}

export const findUserByCredentials = async (email, contraseña) => {
    await ensureUsersReady()
    const normalizedEmail = String(email || '').toLowerCase()
    const user = await User.findOne({ email: normalizedEmail, contraseña }).lean()
    return normalizeUser(user)
}

export const createUser = async ({ nombre, apellido, email, contraseña, fecha_nacimiento }) => {
    await ensureUsersReady()

    const normalizedEmail = String(email || '').toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail }).lean()
    if (existingUser) {
        const error = new Error('Este email ya está registrado')
        error.statusCode = 409
        throw error
    }

    const highestUser = await User.findOne().sort({ id: -1 }).lean()
    const createdUser = await User.create({
        id: highestUser ? highestUser.id + 1 : 1,
        nombre,
        apellido,
        email: normalizedEmail,
        contraseña,
        fecha_nacimiento: fecha_nacimiento ?? null,
        ventas_ids: []
    })

    return normalizeUser(createdUser)
}

export const updateUserName = async (id, nombre) => {
    await ensureUsersReady()
    const updatedUser = await User.findOneAndUpdate(
        { id },
        { $set: { nombre } },
        { new: true, runValidators: true }
    ).lean()

    return normalizeUser(updatedUser)
}

export const deleteUserById = async (id) => {
    await ensureUsersReady()
    const deletedUser = await User.findOneAndDelete({ id }).lean()
    return normalizeUser(deletedUser)
}