import axios from 'axios'
import { URLEtiquetaUnidad } from '../constants/api'

export const WMSApiEtiquetaUnidad = axios.create({
    baseURL: URLEtiquetaUnidad,
    headers: {
        'Content-Type': 'application/json'
    }
})
