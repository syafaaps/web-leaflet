import { Pool } from 'pg';

const pool = new Pool({
  user: 'alvina',
  host: '192.168.60.108',
  database: 'harga_komoditas',
  password: 'alvina',
  port: 5432,
});

export default pool;