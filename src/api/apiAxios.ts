import axios from 'axios'
import { WMSUrl } from '../constants/api'

export const ApiAxios = axios.create({
    baseURL: WMSUrl,
    headers: {
        'Content-Type': 'application/json'
      }
})