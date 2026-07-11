import { Pool } from 'pg';

const pool = new Pool({
  user: 'alvina',
  host: '192.168.60.108',
  database: 'harga_komoditas',
  password: 'alvina',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;