const sql = require("mssql");

// Database configuration
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
  requestTimeout: 120000,  // Increase timeout to 120 seconds
  connectionTimeout: 60000, // Increase connection timeout to 60 seconds
};


// // Function to connect to the database
// async function executeQuery(query, values = [], paramNames = [], isStoredProcedure = false) {
//   try {
//     const pool = await sql.connect(config);
//     const request = pool.request();

//     if (values.length && paramNames.length) {
//       values.forEach((val, index) => {
//         request.input(paramNames[index], val);
//       });
//     }

//     const result = isStoredProcedure ? await request.execute(query) : await request.query(query);

//     return result.recordset;
//   } catch (error) {
//     console.error("Database query error:", error);
//     throw error;
//   }
// }


// Function to connect to the database
// async function executeQuery(query, params = {}) {
//   try {
//     const pool = await sql.connect({
//       ...config, 
//       options: {
//         encrypt: true,         // Needed for Azure SQL
//         enableArithAbort: true // Prevents some SQL Server issues
//       },
//       requestTimeout: 60000,  // 60 seconds timeout (increase if needed)
//       connectionTimeout: 30000 // 30 seconds timeout for connections
//     });

//     const request = pool.request();

//     // Dynamically add input parameters
//     // Object.keys(params).forEach(paramName => {
//     //   request.input(paramName.replace('@', ''), params[paramName]);
//     // });

//     Object.keys(params).forEach(paramName => {
//       const value = params[paramName];
//       if (paramName.includes('tagName')) {
//         request.input(paramName.replace('@', ''), sql.VarChar, value); // Explicitly set as VarChar
//       } else if (paramName.includes('Date')) {
//         request.input(paramName.replace('@', ''), sql.DateTime, value); // Explicitly set as DateTime
//       } else {
//         request.input(paramName.replace('@', ''), value); // Let driver infer other types
//       }
//     });

//     // Set query timeout to prevent ETIMEOUT errors
//     request.timeout = 60000; // Set query execution timeout (1 min)

//     const result = await request.query(query);
//     return result.recordset;
//   } catch (error) {
//     console.error("Database query error:", error);
//     throw error;
//   }
// }

async function executeQuery(query, params = {}) {
  let pool;
  try {
    pool = await sql.connect(config);

    const request = pool.request();
    Object.keys(params).forEach(paramName => {
      const value = params[paramName];
      if (paramName.includes('tagName')) {
        request.input(paramName.replace('@', ''), sql.VarChar, value);
      } else if (paramName.includes('Date')) {
        request.input(paramName.replace('@', ''), sql.DateTime, value);
      } else {
        request.input(paramName.replace('@', ''), value);
      }
    });

    request.timeout = 120000; // Set query execution timeout (2 min)

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    if (pool) pool.close(); // Close connection after query
  }
}




// Export the module
module.exports = {
  connect: () => sql.connect(config),
  sql,
  executeQuery,
};




