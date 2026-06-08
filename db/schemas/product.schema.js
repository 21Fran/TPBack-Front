import mongoose from 'mongoose'

const { Schema, models, model } = mongoose;


const ProductSchema = new Schema(
    {
        id: { type: Number, required: true, unique: true, index: true },
        categoria: { type: String, required: true, trim: true },
        nombre: { type: String, required: true, trim: true },
        desc: { type: String, required: true, trim: true },
        precio: { type: Number, required: true, min: 0 },
        imagen: { type: String, required: true, trim: true },
        en_oferta: { type: Boolean, required: true, default: false }
    },
    { versionKey: false }
)

const Product = mongoose.models.Product || model('Product', ProductSchema)

export default Product