const { executeQuery } = require("../config/db_connect");

// Function to get all records from 7:00 AM of the previous day to 6:00 AM of the current day
const getHourlyRecordsLast3Months = async (req, res) => {
  try {
      const numberOfDays = 30; // Approximately 2 months
      const allRecords = [];
      const now = new Date();

      for (let i = 0; i < numberOfDays; i++) {
          const currentDate = new Date(now);
          currentDate.setDate(now.getDate() - i);

          // **Office Hours Shift (7:00 AM to 6:00 PM)**
          const officeHoursTo = new Date(currentDate);
          officeHoursTo.setHours(18, 0, 0, 0); // 6:00 PM

          const officeHoursFrom = new Date(currentDate);
          officeHoursFrom.setHours(7, 0, 0, 0); // 7:00 AM

          const officeHoursQuery = `
              SELECT H.DateTime, H.TagName, H.Value, T.Description
              FROM History H
              INNER JOIN _Tag T ON H.TagName = T.TagName
              WHERE H.TagName IN (
                  'Marampa_1C.A1241FIC043_PV',
                  'Marampa_1C.A1241DIC043_PV',
                  'Marampa_1C.A1241PIT042_PV',
                  'Marampa_1C.A1226WIT004_TOT_HourLast',
                  'Marampa_1C.A1226WIT004_TOT_DayCurrent',
                  'Marampa_1B.A2251WQIT5114_TOT_HourLast',
                  'Marampa_1B.A2251WQIT5114_TOT_DayCurrent'
                  
              )
              AND wwCycleCount = 100
              AND wwRetrievalMode = 'cyclic'
              AND H.DateTime BETWEEN @fromDate AND @toDate
              ORDER BY H.DateTime
          `;

          const officeHoursParams = {
              fromDate: officeHoursFrom.toISOString().slice(0, 19).replace("T", " "),
              toDate: officeHoursTo.toISOString().slice(0, 19).replace("T", " ")
          };

          const officeHoursRecords = await executeQuery(officeHoursQuery, officeHoursParams);
          allRecords.push(...officeHoursRecords);

          // **Night Shift (6:00 PM to 6:00 AM the next morning)**
          const nightShiftTo = new Date(currentDate);
          nightShiftTo.setDate(currentDate.getDate() + 1); // Next day
          nightShiftTo.setHours(6, 0, 0, 0); // 6:00 AM

          const nightShiftFrom = new Date(currentDate);
          nightShiftFrom.setHours(18, 0, 0, 0); // 6:00 PM

          const nightShiftQuery = `
              SELECT H.DateTime, H.TagName, H.Value, T.Description
              FROM History H
              INNER JOIN _Tag T ON H.TagName = T.TagName
              WHERE H.TagName IN (
                  'Marampa_1C.A1241FIC043_PV',
                  'Marampa_1C.A1241DIC043_PV',
                  'Marampa_1C.A1241PIT042_PV',
                  'Marampa_1C.A1226WIT004_TOT_HourLast',
                  'Marampa_1C.A1226WIT004_TOT_DayCurrent',
                  'Marampa_1B.A2251WQIT5114_TOT_HourLast',
                  'Marampa_1B.A2251WQIT5114_TOT_DayCurrent'
              )
              AND wwCycleCount = 100
              AND wwRetrievalMode = 'cyclic'
              AND H.DateTime BETWEEN @fromDate AND @toDate
              ORDER BY H.DateTime
          `;

          const nightShiftParams = {
              fromDate: nightShiftFrom.toISOString().slice(0, 19).replace("T", " "),
              toDate: nightShiftTo.toISOString().slice(0, 19).replace("T", " ")
          };

          const nightShiftRecords = await executeQuery(nightShiftQuery, nightShiftParams);
          allRecords.push(...nightShiftRecords);
      }

      res.status(200).json(allRecords);

  } catch (error) {
      console.error("Error fetching hourly records:", error);
      res.status(500).json({ message: "Error fetching hourly records", error });
  }
};


// const getAllRecordsForCurrentMonth = async (req, res) => {
//     try {
//       const now = new Date();
//       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//       const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
//       const query = `
//         SELECT H.DateTime, H.TagName, H.Value, T.Description
//         FROM History H
//         INNER JOIN _Tag T ON H.TagName = T.TagName
//         WHERE H.DateTime BETWEEN @fromDate AND @toDate
//         ORDER BY H.DateTime
//       `;
  
//       const params = {
//         fromDate: startOfMonth.toISOString().slice(0, 19).replace("T", " "),
//         toDate: endOfMonth.toISOString().slice(0, 19).replace("T", " ")
//       };
  
//       const allRecords = await executeQuery(query, params);
//       res.status(200).json(allRecords);
  
//     } catch (error) {
//       console.error("Error fetching all records for the current month:", error);
//       res.status(500).json({ message: "Error fetching records for the current month", error });
//     }
//   };

// const getAllRecordsForCurrentMonth = async (req, res) => {
//     try {
//       const now = new Date();
//       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//       const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
//       const tagNamePattern = "Marampa_%"; // Only fetch valid tag names
  
//       // Step 1: Fetch valid tag names
//       const tagQuery = `SELECT DISTINCT TagName FROM History WHERE TagName LIKE @tagNamePattern`;
//       const tagParams = { tagNamePattern };
//       const validTags = await executeQuery(tagQuery, tagParams);
  
//       if (!validTags.length) {
//         return res.status(404).json({ message: "No matching TagNames found" });
//       }
  
//       // Step 2: Fetch history data using valid TagNames
//       const tagNames = validTags.map(tag => `'${tag.TagName}'`).join(",");
  
//       const query = `
//         SELECT H.DateTime, H.TagName, H.Value, T.Description
//         FROM History H
//         INNER JOIN _Tag T ON H.TagName = T.TagName
//         WHERE H.DateTime BETWEEN @fromDate AND @toDate
//         AND H.TagName IN (${tagNames})
//         ORDER BY H.DateTime
//       `;
  
//       const params = {
//         fromDate: startOfMonth.toISOString().slice(0, 19).replace("T", " "),
//         toDate: endOfMonth.toISOString().slice(0, 19).replace("T", " "),
//       };
  
//       console.log("Query:", query);
//       console.log("Parameters:", params);
  
//       const allRecords = await executeQuery(query, params);
//       res.status(200).json(allRecords);
//     } catch (error) {
//       console.error("Error fetching records for the current month:", error);
//       res.status(500).json({ message: "Error fetching records", error });
//     }
//   };

// const getAllRecordsEng = async (req, res) => {
//     try {
//         const now = new Date();
//         // const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//         // const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
//         const oneWeekAgo = new Date();
//         oneWeekAgo.setDate(now.getDate() - 7);


//         // Step 1: Fetch valid tag names
//         const tagQuery = `SELECT DISTINCT TagName FROM History WHERE TagName LIKE @tagNamePattern`;
//         const tagParams = { tagNamePattern: "Marampa_%" };
//         const validTags = await executeQuery(tagQuery, tagParams);

//         if (!validTags.length) {
//             return res.status(404).json({ message: "No matching TagNames found" });
//         }

//         const tagNames = validTags.map(tag => `'${tag.TagName}'`).join(",");

//         // Step 2: Fetch all history data for the current month
//         const query = `
//             SELECT H.DateTime, H.TagName, H.Value, T.Description
//             FROM History H
//             INNER JOIN _Tag T ON H.TagName = T.TagName
//             WHERE H.DateTime BETWEEN @fromDate AND @toDate
//             AND H.TagName IN (${tagNames})
//             AND H.wwCycleCount = 100
//             AND H.wwRetrievalMode = 'cyclic'
//             ORDER BY H.DateTime
//         `;

//         // const fromDate = startOfCurrentMonth.toISOString().slice(0, 19).replace("T", " ");
//         // const toDate = endOfCurrentMonth.toISOString().slice(0, 19).replace("T", " ");

//         const fromDate = oneWeekAgo.toISOString().slice(0, 19).replace("T", " ");
//         const toDate = now.toISOString().slice(0, 19).replace("T", " ");

//         const params = {
//             fromDate: fromDate,
//             toDate: toDate,
//         };

//         // console.log("Query (Current Month - All Data):", query);
//         // console.log("Parameters (Current Month - All Data):", params);
//         console.log("Query (Past Week):", query);
//         console.log("Parameters (Past Week):", params);

//         const allRecords = await executeQuery(query, params);
//         res.status(200).json(allRecords);
//     } catch (error) {
//         // console.error("Error fetching all records for the current month:", error);
//         // res.status(500).json({ message: "Error fetching all records for the current month", error });
//         console.error("Error fetching all records for the past week:", error);
//         res.status(500).json({ message: "Error fetching all records for the past week", error });
//     }
// };
  

// const getAllRecordsEng = async (req, res) => { 
//     try {
//         const now = new Date();
//         const oneWeekAgo = new Date();
//         oneWeekAgo.setDate(now.getDate() - 7);

//         // Extract asset filter from request parameters
//         const assetFilter = req.query.asset; // e.g., "PU319" or "pu-212A"
        
//         // Step 1: Fetch valid tag names
//         const tagQuery = `SELECT DISTINCT TagName FROM History WHERE TagName LIKE @tagNamePattern`;
//         const tagParams = { tagNamePattern: "Marampa_%" };
//         const validTags = await executeQuery(tagQuery, tagParams);

//         if (!validTags.length) {
//             return res.status(404).json({ message: "No matching TagNames found" });
//         }

//         const tagNames = validTags.map(tag => `'${tag.TagName}'`).join(",");

//         // Build the base query
//         let query = `
//             SELECT H.DateTime, H.TagName, H.Value, T.Description
//             FROM History H
//             INNER JOIN _Tag T ON H.TagName = T.TagName
//             WHERE H.DateTime BETWEEN @fromDate AND @toDate
//             AND H.TagName IN (${tagNames})
//             AND H.wwCycleCount = 100
//             AND H.wwRetrievalMode = 'cyclic'
//         `;

//         // Add asset filtering if provided
//         if (assetFilter) {
//             // This will match TagName or Description containing the asset identifier, case-insensitive
//             query += ` AND (
//                 H.TagName LIKE '%${assetFilter}%' 
//                 OR T.Description LIKE '%${assetFilter}%'
//             )`;
//         }

//         query += ` ORDER BY H.DateTime`;

//         const fromDate = oneWeekAgo.toISOString().slice(0, 19).replace("T", " ");
//         const toDate = now.toISOString().slice(0, 19).replace("T", " ");

//         const params = {
//             fromDate: fromDate,
//             toDate: toDate,
//         };

//         console.log("Query:", query);
//         console.log("Parameters:", params);
//         console.log("Asset Filter:", assetFilter || "None");

//         const allRecords = await executeQuery(query, params);
//         res.status(200).json(allRecords);
//     } catch (error) {
//         console.error("Error fetching filtered records:", error);
//         res.status(500).json({ message: "Error fetching filtered records", error });
//     }
// };

// // Add a new endpoint function for specific asset data
// const getAssetData = async (req, res) => {
//     try {
//         const { asset } = req.params;
        
//         if (!asset) {
//             return res.status(400).json({ message: "Asset identifier is required" });
//         }

//         const now = new Date();
//         const oneWeekAgo = new Date();
//         oneWeekAgo.setDate(now.getDate() - 7);

//         // Get all tags related to this asset
//         const query = `
//             SELECT H.DateTime, H.TagName, H.Value, T.Description
//             FROM History H
//             INNER JOIN _Tag T ON H.TagName = T.TagName
//             WHERE H.DateTime BETWEEN @fromDate AND @toDate
//             AND (H.TagName LIKE @assetPattern OR T.Description LIKE @assetPattern)
//             AND H.wwCycleCount = 100
//             AND H.wwRetrievalMode = 'cyclic'
//             ORDER BY H.DateTime
//         `;

//         const fromDate = oneWeekAgo.toISOString().slice(0, 19).replace("T", " ");
//         const toDate = now.toISOString().slice(0, 19).replace("T", " ");

//         const params = {
//             fromDate: fromDate,
//             toDate: toDate,
//             assetPattern: `%${asset}%`
//         };

//         console.log("Asset Query:", query);
//         console.log("Parameters:", params);

//         const assetRecords = await executeQuery(query, params);
        
//         if (!assetRecords.length) {
//             return res.status(404).json({ message: `No data found for asset: ${asset}` });
//         }
        
//         res.status(200).json(assetRecords);
//     } catch (error) {
//         console.error(`Error fetching data for asset ${req.params.asset}:`, error);
//         res.status(500).json({ message: `Error fetching data for asset ${req.params.asset}`, error });
//     }
// };
  


// const getAllRecordsEng = async (req, res) => { 
//     try {
//         // Extract query parameters for filtering
//         const assetFilter = req.query.asset; // e.g., "PU319" or "pu-212A"
        
//         // Extract date range from request or use default (past week)
//         let fromDate, toDate;
        
//         if (req.query.fromDate && req.query.toDate) {
//             // Use provided date range
//             fromDate = new Date(req.query.fromDate);
//             toDate = new Date(req.query.toDate);
            
//             // Add time to toDate if not specified to include the entire day
//             if (toDate.getHours() === 0 && toDate.getMinutes() === 0 && toDate.getSeconds() === 0) {
//                 toDate.setHours(23, 59, 59, 999);
//             }
//         } else {
//             // Default to past week if no date range specified
//             toDate = new Date();
//             fromDate = new Date();
//             fromDate.setDate(toDate.getDate() - 7);
//         }
        
//         // Format dates for SQL query
//         const formattedFromDate = fromDate.toISOString().slice(0, 19).replace("T", " ");
//         const formattedToDate = toDate.toISOString().slice(0, 19).replace("T", " ");

//         // Step 1: Fetch valid tag names
//         const tagQuery = `SELECT DISTINCT TagName FROM History WHERE TagName LIKE @tagNamePattern`;
//         const tagParams = { tagNamePattern: "Marampa_%" };
//         const validTags = await executeQuery(tagQuery, tagParams);

//         if (!validTags.length) {
//             return res.status(404).json({ message: "No matching TagNames found" });
//         }

//         const tagNames = validTags.map(tag => `'${tag.TagName}'`).join(",");

//         // Build the base query
//         let query = `
//             SELECT H.DateTime, H.TagName, H.Value, T.Description
//             FROM History H
//             INNER JOIN _Tag T ON H.TagName = T.TagName
//             WHERE H.DateTime BETWEEN @fromDate AND @toDate
//             AND H.TagName IN (${tagNames})
//             AND H.wwCycleCount = 100
//             AND H.wwRetrievalMode = 'cyclic'
//         `;

//         // Add asset filtering if provided
//         if (assetFilter) {
//             // This will match TagName or Description containing the asset identifier, case-insensitive
//             query += ` AND (
//                 H.TagName LIKE '%${assetFilter}%' 
//                 OR T.Description LIKE '%${assetFilter}%'
//             )`;
//         }

//         query += ` ORDER BY H.DateTime`;

//         const params = {
//             fromDate: formattedFromDate,
//             toDate: formattedToDate,
//         };

//         console.log("Query:", query);
//         console.log("Parameters:", params);
//         console.log("Filters - Asset:", assetFilter || "None");
//         console.log("Filters - Date Range:", `${formattedFromDate} to ${formattedToDate}`);

//         const allRecords = await executeQuery(query, params);
//         res.status(200).json(allRecords);
//     } catch (error) {
//         console.error("Error fetching filtered records:", error);
//         res.status(500).json({ message: "Error fetching filtered records", error });
//     }
// };



// const getAllRecordsEng = async (req, res) => {
//     try {
//       const assetFilter = req.query.assets;
//       console.log("Asset Filter:", assetFilter || "None");
  
//       let fromDate, toDate;
  
//       if (req.query.fromDate && req.query.toDate) {
//         // Use exactly the date provided by the user
//         const selectedFromDate = new Date(req.query.fromDate);
//         selectedFromDate.setHours(7, 0, 0, 0); // 7:00 AM on fromDate
  
//         const selectedToDate = new Date(req.query.toDate);
//         selectedToDate.setHours(6, 0, 0, 0); // 6:00 AM on toDate
  
//         fromDate = selectedFromDate;
//         toDate = selectedToDate;
//       } else {
//         // Fallback: default to current day shift (previous 7:00 AM to today 6:00 AM)
//         const now = new Date();
//         toDate = new Date(now);
//         toDate.setHours(6, 0, 0, 0);
  
//         fromDate = new Date(now);
//         fromDate.setDate(fromDate.getDate() - 1);
//         fromDate.setHours(7, 0, 0, 0);
//       }
  
//       const formattedFromDate = fromDate.toISOString().slice(0, 19).replace("T", " ");
//       const formattedToDate = toDate.toISOString().slice(0, 19).replace("T", " ");
  
//       // Step 1: Get all valid Marampa_ tags
//       const tagQuery = `SELECT DISTINCT TagName FROM History WHERE TagName LIKE @tagNamePattern`;
//       const tagParams = { tagNamePattern: "Marampa_%" };
//       const validTags = await executeQuery(tagQuery, tagParams);
  
//       if (!validTags.length) {
//         return res.status(404).json({ message: "No matching TagNames found" });
//       }
  
//       const tagNames = validTags.map(tag => `'${tag.TagName}'`).join(",");
  
//       // Step 2: Build main query
//       let query = `
//         SELECT H.DateTime, H.TagName, H.Value, T.Description
//         FROM History H
//         INNER JOIN _Tag T ON H.TagName = T.TagName
//         WHERE H.DateTime BETWEEN @fromDate AND @toDate
//         AND H.TagName IN (${tagNames})
//         AND H.wwCycleCount = 100
//         AND H.wwRetrievalMode = 'cyclic'
//       `;
  
//       // Asset filtering
//       if (assetFilter) {
//         query += ` AND (
//           H.TagName LIKE '%${assetFilter}%'
//           OR T.Description LIKE '%${assetFilter}%'
//         )`;
//       }
  
//       query += ` ORDER BY H.DateTime`;
  
//       const params = {
//         fromDate: formattedFromDate,
//         toDate: formattedToDate,
//       };
  
//       console.log("Query:", query);
//       console.log("Parameters:", params);
//       console.log("Asset Filter:", assetFilter || "None");
  
//       const allRecords = await executeQuery(query, params);
//       console.log("Number of Records:", allRecords.length);
//       console.log("Records:", allRecords);
      
//       res.status(200).json(allRecords);
//     } catch (error) {
//       console.error("Error fetching filtered records:", error);
//       res.status(500).json({
//         message: "Error fetching filtered records",
//         error: error.message,
//       });
//     }
//   };


// const getAllRecordsEng = async (req, res) => {
//   try {
//     const assetFilter = req.query.assets;
//     console.log("Asset Filter:", assetFilter || "None");

//     let fromDate, toDate;

//     if (req.query.fromDate && req.query.toDate) {
//       const selectedFromDate = new Date(req.query.fromDate);
//       selectedFromDate.setHours(7, 0, 0, 0); // 7:00 AM

//       const selectedToDate = new Date(req.query.toDate);
//       selectedToDate.setHours(6, 0, 0, 0); // 6:00 AM

//       fromDate = selectedFromDate;
//       toDate = selectedToDate;
//     } else {
//       const now = new Date();
//       toDate = new Date(now);
//       toDate.setHours(6, 0, 0, 0);

//       fromDate = new Date(now);
//       fromDate.setDate(fromDate.getDate() - 1);
//       fromDate.setHours(7, 0, 0, 0);
//     }

//     const formattedFromDate = fromDate.toISOString().slice(0, 19).replace("T", " ");
//     const formattedToDate = toDate.toISOString().slice(0, 19).replace("T", " ");

//     // Step 1: Get all valid tags matching the assetFilter or default to 'Marampa_%'
//     const tagNamePattern = assetFilter ? `${assetFilter}%` : "Marampa_%";
//     const tagQuery = `SELECT DISTINCT TagName FROM History WHERE TagName LIKE @tagNamePattern`;
//     const tagParams = { tagNamePattern };
//     const validTags = await executeQuery(tagQuery, tagParams);

//     if (!validTags.length) {
//       return res.status(404).json({ message: "No matching TagNames found" });
//     }

//     const tagNames = validTags.map(tag => `'${tag.TagName}'`).join(",");

//     // Step 2: Build main query
//     let query = `
//       SELECT H.DateTime, H.TagName, H.Value, T.Description
//       FROM History H
//       INNER JOIN _Tag T ON H.TagName = T.TagName
//       WHERE H.DateTime BETWEEN @fromDate AND @toDate
//       AND H.TagName IN (${tagNames})
//       AND H.wwCycleCount = 100
//       AND H.wwRetrievalMode = 'cyclic'
//     `;

//     // Optional asset filtering on TagName or Description
//     if (assetFilter) {
//       query += ` AND (
//         H.TagName LIKE '%${assetFilter}%'
//         OR T.Description LIKE '%${assetFilter}%'
//       )`;
//     }

//     query += ` ORDER BY H.DateTime`;

//     const params = {
//       fromDate: formattedFromDate,
//       toDate: formattedToDate,
//     };

//     console.log("Query:", query);
//     console.log("Parameters:", params);
//     console.log("Asset Filter:", assetFilter || "None");

//     const allRecords = await executeQuery(query, params);

//     console.log("Number of Records:", allRecords.length);
//     res.status(200).json(allRecords);
//   } catch (error) {
//     console.error("Error fetching filtered records:", error);
//     res.status(500).json({
//       message: "Error fetching filtered records",
//       error: error.message,
//     });
//   }
// };

const getAllRecordsEng = async (req, res) => {
  try {
    const assetFilter = req.query.assets;
    console.log("Asset Filter:", assetFilter || "None");

    let fromDate, toDate;

    if (req.query.fromDate && req.query.toDate) {
      const selectedFromDate = new Date(req.query.fromDate);
      selectedFromDate.setHours(7, 0, 0, 0); // 7:00 AM

      const selectedToDate = new Date(req.query.toDate);
      selectedToDate.setHours(6, 0, 0, 0); // 6:00 AM

      fromDate = selectedFromDate;
      toDate = selectedToDate;
    } else {
      const now = new Date();
      toDate = new Date(now);
      toDate.setHours(6, 0, 0, 0);

      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 1);
      fromDate.setHours(7, 0, 0, 0);
    }

    const formattedFromDate = fromDate.toISOString().slice(0, 19).replace("T", " ");
    const formattedToDate = toDate.toISOString().slice(0, 19).replace("T", " ");

    // Step 1: Get valid TagNames based on Description filter
    const tagFilter = assetFilter ? `%${assetFilter}%` : "Marampa_%";
    const tagQuery = `
      SELECT DISTINCT T.TagName
      FROM _Tag T
      WHERE T.TagName LIKE @tagFilter
    `;
    const tagParams = { tagFilter };
    const validTags = await executeQuery(tagQuery, tagParams);

    if (!validTags.length) {
      return res.status(404).json({ message: "No matching descriptions found" });
    }

    const tagNames = validTags.map(tag => `'${tag.TagName}'`).join(",");

    // Step 2: Build main query
    const query = `
      SELECT H.DateTime, H.TagName, H.Value, T.Description
      FROM History H
      INNER JOIN _Tag T ON H.TagName = T.TagName
      WHERE H.DateTime BETWEEN @fromDate AND @toDate
      AND H.TagName IN (${tagNames})
      AND H.wwCycleCount = 100
      AND H.wwRetrievalMode = 'cyclic'
      ORDER BY H.DateTime
    `;

    const params = {
      fromDate: formattedFromDate,
      toDate: formattedToDate,
    };

    console.log("Query:", query);
    console.log("Parameters:", params);
    console.log("TagName Filter:", assetFilter || "None");

    const allRecords = await executeQuery(query, params);
    console.log("Number of Records:", allRecords.length);
    
    res.status(200).json(allRecords);
  } catch (error) {
    console.error("Error fetching filtered records:", error);
    res.status(500).json({
      message: "Error fetching filtered records",
      error: error.message,
    });
  }
};


  

  

// Dedicated endpoint function for specific asset data with date range
// const getAssetData = async (req, res) => {
//     try {
//         const { asset } = req.params;
        
//         if (!asset) {
//             return res.status(400).json({ message: "Asset identifier is required" });
//         }
        
//         // Extract date range from request or use default (past week)
//         let fromDate, toDate;
        
//         if (req.query.fromDate && req.query.toDate) {
//             // Use provided date range
//             fromDate = new Date(req.query.fromDate);
//             toDate = new Date(req.query.toDate);
            
//             // Add time to toDate if not specified to include the entire day
//             if (toDate.getHours() === 0 && toDate.getMinutes() === 0 && toDate.getSeconds() === 0) {
//                 toDate.setHours(23, 59, 59, 999);
//             }
//         } else {
//             // Default to past week if no date range specified
//             toDate = new Date();
//             fromDate = new Date();
//             fromDate.setDate(toDate.getDate() - 7);
//         }
        
//         // Format dates for SQL query
//         const formattedFromDate = fromDate.toISOString().slice(0, 19).replace("T", " ");
//         const formattedToDate = toDate.toISOString().slice(0, 19).replace("T", " ");

//         // Get all tags related to this asset
//         const query = `
//             SELECT H.DateTime, H.TagName, H.Value, T.Description
//             FROM History H
//             INNER JOIN _Tag T ON H.TagName = T.TagName
//             WHERE H.DateTime BETWEEN @fromDate AND @toDate
//             AND (H.TagName LIKE @assetPattern OR T.Description LIKE @assetPattern)
//             AND H.wwCycleCount = 100
//             AND H.wwRetrievalMode = 'cyclic'
//             ORDER BY H.DateTime
//         `;

//         const params = {
//             fromDate: formattedFromDate,
//             toDate: formattedToDate,
//             assetPattern: `%${asset}%`
//         };

//         console.log("Asset Query:", query);
//         console.log("Parameters:", params);
//         console.log("Filters - Asset:", asset);
//         console.log("Filters - Date Range:", `${formattedFromDate} to ${formattedToDate}`);

//         const assetRecords = await executeQuery(query, params);
        
//         if (!assetRecords.length) {
//             return res.status(404).json({ message: `No data found for asset: ${asset} in the specified date range` });
//         }
        
//         res.status(200).json(assetRecords);
//     } catch (error) {
//         console.error(`Error fetching data for asset ${req.params.asset}:`, error);
//         res.status(500).json({ message: `Error fetching data for asset ${req.params.asset}`, error });
//     }
// };



const getAssetData = async (req, res) => {
    try {
      const { asset } = req.params;
  
      if (!asset) {
        return res.status(400).json({ message: "Asset identifier is required" });
      }
  
      let fromDate, toDate;
  
      if (req.query.fromDate && req.query.toDate) {
        const selectedToDate = new Date(req.query.toDate);
        selectedToDate.setHours(6, 0, 0, 0); // 6:00 AM of selected day
  
        const selectedFromDate = new Date(req.query.fromDate);
        selectedFromDate.setDate(selectedFromDate.getDate() - 1); // previous day
        selectedFromDate.setHours(7, 0, 0, 0); // 7:00 AM
  
        fromDate = selectedFromDate;
        toDate = selectedToDate;
      } else {
        toDate = new Date();
        toDate.setHours(6, 0, 0, 0);
  
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 1);
        fromDate.setHours(7, 0, 0, 0);
      }
  
      const formattedFromDate = fromDate.toISOString().slice(0, 19).replace("T", " ");
      const formattedToDate = toDate.toISOString().slice(0, 19).replace("T", " ");
  
      const query = `
        SELECT H.DateTime, H.TagName, H.Value, T.Description
        FROM History H
        INNER JOIN _Tag T ON H.TagName = T.TagName
        WHERE H.DateTime BETWEEN @fromDate AND @toDate
        AND (H.TagName LIKE @assetPattern OR T.Description LIKE @assetPattern)
        AND H.wwCycleCount = 100
        AND H.wwRetrievalMode = 'cyclic'
        ORDER BY H.DateTime
      `;
  
      const params = {
        fromDate: formattedFromDate,
        toDate: formattedToDate,
        assetPattern: `%${asset}%`,
      };
  
      console.log("Asset Query:", query);
      console.log("Parameters:", params);
      console.log("Filters - Asset:", asset);
      console.log("Filters - Date Range:", `${formattedFromDate} to ${formattedToDate}`);
  
      const assetRecords = await executeQuery(query, params);
  
      if (!assetRecords.length) {
        return res.status(404).json({ message: `No data found for asset: ${asset} in the specified date range` });
      }
  
      res.status(200).json(assetRecords);
    } catch (error) {
      console.error(`Error fetching data for asset ${req.params.asset}:`, error);
      res.status(500).json({ message: `Error fetching data for asset ${req.params.asset}`, error });
    }
  };
  

module.exports = {
  getHourlyRecordsLast3Months,
  getAllRecordsEng,
  getAssetData
};
