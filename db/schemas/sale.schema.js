import mongoose from 'mongoose'

const { Schema, model } = mongoose

const SaleSchema = new Schema(
    {
        id: { type: Number, required: true, unique: true, index: true },
        id_usuario: { type: Number, required: true, index: true },
        fecha: { type: String, required: true, trim: true },
        total: { type: Number, required: true, min: 0 },
        dirección: { type: String, required: true, trim: true },
        productos: { type: [Number], required: true, default: [] }
    },
    { versionKey: false }
)

const Sale = mongoose.models.Sale || model('Sale', SaleSchema)

export default Sale