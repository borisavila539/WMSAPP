import axios from 'axios'
import { URLAuditoriaInterna } from '../constants/api'

export const WMSApiAuditoriaInterna = axios.create({
    baseURL: URLAuditoriaInterna,
    headers: {
        'Content-Type': 'application/json'
    }
})
