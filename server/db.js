import mysql from 'mysql2/promise';
import { config } from './config.js';
export default mysql.createPool({ ...config.database, waitForConnections: true, connectionLimit: 5, charset: 'utf8mb4' });
