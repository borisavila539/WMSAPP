import axios from 'axios'
import { WMSMB } from '../constants/api'

export const WMSApiMB = axios.create({
    baseURL: WMSMB,
    headers: {
        'Content-Type': 'application/json'
      }
})