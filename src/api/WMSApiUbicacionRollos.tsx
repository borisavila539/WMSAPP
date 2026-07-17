import axios from 'axios';
import { URLUbicacionRollos } from '../constants/api';


export const WMSApiUbicacionRollos = axios.create({
    baseURL: URLUbicacionRollos,
    headers: {
        'Content-Type': 'application/json'
    }
});