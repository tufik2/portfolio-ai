import mysql from 'mysql2/promise';

export const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // All DATETIME columns hold UTC (UTC_TIMESTAMP()); read and write them as UTC.
  timezone: 'Z',
};

const pool = mysql.createPool(dbConfig);

export default pool;
