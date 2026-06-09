import jwt from 'jsonwebtoken'
import { SECRET } from '../config/auth.config.js'

export default function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization
    let token = null

    if (authHeader && typeof authHeader === 'string') {
        const parts = authHeader.split(' ')
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1]
        }
    }

    token = token || req.body?.token || req.query?.token

    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó token de autenticación' })
    }

    try {
        const decoded = jwt.verify(token, SECRET)
        req.user = decoded.result || null
        next()
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido' })
    }
}
