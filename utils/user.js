import { getUserById } from '../db/actions/user.actions.js'

export const get_user_by_id = async (id) => {
    return getUserById(id)
}