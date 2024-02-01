import axios from 'axios'
import { WMSUrl } from '../constants/api'
export const WmSApi = axios.create({
    baseURL: WMSUrl,
    headers: {
        'Content-Type': 'application/json'
      }
})