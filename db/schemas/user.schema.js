import mongoose from 'mongoose'

const { Schema, model } = mongoose

const UserSchema = new Schema(
    {
        id: { type: Number, required: true, unique: true, index: true },
        nombre: { type: String, required: true, trim: true },
        apellido: { type: String, default: '', trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        contraseña: { type: String, required: true },
        fecha_nacimiento: { type: String, default: null },
        ventas_ids: { type: [Number], default: [] }
    },
    { versionKey: false }
)

const User = mongoose.models.User || model('User', UserSchema)

export default User