import axios from 'axios';
import { WMSSerigrafia } from '../constants/api';


export const WMSApiSerigrafia = axios.create({
    baseURL: WMSSerigrafia,
    headers: {
        'Content-Type': 'application/json'
    }
});