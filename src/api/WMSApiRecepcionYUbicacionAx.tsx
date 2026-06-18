import axios from 'axios';
import { WMSURLRecepcionYUbicacionAx } from '../constants/api';


export const WMSApiRecepcionYUbicacionAx = axios.create({
    baseURL: WMSURLRecepcionYUbicacionAx,
    headers: {
        'Content-Type': 'application/json'
    }
});