import bcrypt from "bcrypt";
import {
    SALT_ROUNDS,
} from '../configs/systemVariables.js';

const getHashedPassword = async (plainPassword) => {

        const salt = await bcrypt.genSalt(Number(SALT_ROUNDS));

        return  bcrypt.hash(plainPassword, salt);
}

const comparePassword = (hashPassword, plainPassword) => {
    return bcrypt.compare(plainPassword, hashPassword);
}

export {getHashedPassword, comparePassword};