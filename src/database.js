const mssql = require("mssql");

require("dotenv").config();

const dbConfig = {
  user: process.env.user,
  password: process.env.password,
  server: process.env.server,
  database: process.env.database,
  dialect: "mssql",
  requestTimeout: 600000,
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
};

const CONNECTION_POOL = new mssql.ConnectionPool(dbConfig);

const POOL_CONNECT = CONNECTION_POOL.connect();

module.exports = { CONNECTION_POOL, POOL_CONNECT };
