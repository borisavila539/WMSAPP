import axios from 'axios'
import { WMSUrlCaex } from '../constants/api'

export const WmSApiCaex = axios.create({
    baseURL: WMSUrlCaex,
    headers: {
        'Content-Type': 'application/json'
      }
})