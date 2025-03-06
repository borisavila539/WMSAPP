import axios from 'axios'
import { URL_BASE } from '../constants/api'

export const ApiAxios = axios.create({
    baseURL: URL_BASE,
    headers: {
        'Content-Type': 'application/json'
      }
})