const e = require('express');
const https = require('https');
require('dotenv').config();

// Helper: Make request to Limble API with retry
const makeLimbleRequest = (path, callback, retryCount = 0, maxRetries = 3) => {
  const clientId = process.env.LIMBLE_CLIENT_ID;
  const clientSecret = process.env.LIMBLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return callback({ error: 'Limble API credentials not configured' });
  }

  const options = {
    method: 'GET',
    hostname: 'api.limblecmms.com',
    path: `/v2${path}`,
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
  };

  console.log(`Making request to: ${options.hostname}${options.path} (Attempt ${retryCount + 1})`);

  const request = https.request(options, (response) => {
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const body = Buffer.concat(chunks);
      try {
        const data = JSON.parse(body.toString());
        // Check if we received an error response
        if (data.raw && data.raw.validationError) {
          console.error('Validation error from Limble API:', data.raw);
          return callback({
            error: 'Limble API validation error',
            details: data.raw
          });
        }
        callback(null, data, response.headers);
      } catch (error) {
        callback({
          error: 'Failed to parse response',
          details: error.message,
          rawResponse: body.toString(),
        });
      }
    });
  });

  request.on('error', (error) => {
    console.error(`Error in Limble API request to ${path}:`, error);
    if (retryCount < maxRetries) {
      const delayMs = 2000 * (retryCount + 1); // Exponential backoff: 2s, 4s, 6s
      console.log(`Retrying in ${delayMs}ms...`);

      setTimeout(() => {
        makeLimbleRequest(path, callback, retryCount + 1, maxRetries);
      }, 2000 * (retryCount + 1));
    } else {
      callback({
        error: 'Failed to fetch data after multiple retries',
        details: error.message,
      });
    }
  });

  request.end();
};

// Pagination Helper
const getAllData = async (resourcePath, res, transformData = null) => {
  try {
    let allData = [];
    let currentPage = 1;
    let hasMoreData = true;

    while (hasMoreData) {
      const separator = resourcePath.includes('?') ? '&' : '?';
      const pageUrl = `${resourcePath}${separator}limit=100&page=${currentPage}`;

      const pageData = await new Promise((resolve, reject) => {
        makeLimbleRequest(pageUrl, (err, data) => (err ? reject(err) : resolve(data)));
      });

      let pageItems = Array.isArray(pageData)
        ? pageData
        : pageData.data && Array.isArray(pageData.data)
        ? pageData.data
        : [];

      if (transformData) {
        pageItems = pageItems.map(transformData).filter(Boolean);
      }

      allData = [...allData, ...pageItems];
      hasMoreData = pageItems.length === 100;
      currentPage++;
    }

    return allData;
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching data',
      details: error.message,
    });
  }
};

// Transform asset data
const transformAsset = (asset) => {
  return {
    ...asset,
    assetName: asset.name,
    startedDate: asset.startedOn ? new Date(asset.startedOn * 1000) : null,
    lastEditedDate: asset.lastEdited ? new Date(asset.lastEdited * 1000) : null,
    _links: {
      tasks: asset.meta?.tasks || null,
      fields: asset.meta?.fields || null,
      self: `/assets/${asset.assetID}`,
    },
  };
};

const transformTask = (task) => {
  // Convert task type to readable name
  let taskTypeName = "Unknown";
  switch (task.type) {
    case 1:
      taskTypeName = "Preventative Maintenance (PM)";
      break;
    case 2:
      taskTypeName = "Unplanned Work Order (WO)";
      break;
    case 4:
      taskTypeName = "Planned Work Order (WO)";
      break;
    case 5:
      taskTypeName = "Cycle Count";
      break;
    case 6:
      taskTypeName = "Work Request (WR)";
      break;
    case 7:
      taskTypeName = "Min Part Threshold";
      break;
    case 8:
      taskTypeName = "Materials Request";
      break;
  }
  
  // Convert UNIX timestamp to date if present
  let dueDate = null;
  if (task.due !== undefined && task.due !== null) {
    if (task.due === 0) {
      dueDate = new Date();
    } else {
      dueDate = new Date(task.due * 1000); // Convert UNIX timestamp to milliseconds
    }
  }

  let status = "Unknown";
  switch (task.statusID) {
    case 0:
      status = "Open";
      break;
    case 1:
      status = "In Progress";
      break;
    case 2:
      status = "Completed";
      break;
    case 5617:
      status = "On-Hold For Parts";
      break;
    case 5618:
      status = "Scheduled";
      break;
    case 5654:
      status = "On-Hold For Labor";
      break;
    case 5655:
      status = "On-Hold For Resources";
      break;
    case 5921:
      status = "Plant Offline";
      break;
    case 5922:
      status = "Duplicated PM";
      break;
    case 5923:
      status = "Shutdown Maintenance Canceled";
      break;
  }
  
  // Extract department from customTags, taskName or description
  const validExpenseClasses = [
    "mechanical", "electrical", "inspector", "instrumentation", "boilermaking",
    "np-mechanical", "np-boilermaking", "condition-based-monitoring", "pipe-fitting", "pipe-fitting", "pipe fitting",
    "ph-mechanical", "ph-electrical", "rigging-and-scaffolding"
  ];
  
  const extractExpenseClass = () => {
    const name = task.name || "";
    const sources = [
      ...(task.customTags || []),
      name,
      task.description || "",
      task.requestDropdown1 || ""
    ];
  
    // Check for special combinations in the name that should prioritize "inspector"
    const nameLower = name.toLowerCase();
    if ((nameLower.includes("cbm") && nameLower.includes("@inspector")) || 
        (nameLower.includes("electrical") && nameLower.includes("@inspector")) ||
        (nameLower.includes("el") && nameLower.includes("@inspector"))) {
      return "inspector";
    }
  
    // First, check for exact matches without @ symbol in requestDropdown1
    if (task.requestDropdown1) {
      const dropdownValue = task.requestDropdown1.replace('@', '').toLowerCase().trim();
      
      // Direct check for "pipe fitting" with or without hyphen
      if (dropdownValue === "pipe fitting" || dropdownValue === "pipe-fitting") {
        return "pipe-fitting";
      } else if (dropdownValue === "rigging" || dropdownValue === "scaffolding") {
        return "rigging-and-scaffolding";
      }
      
      // Check for other valid expense classes
      for (const validClass of validExpenseClasses) {
        if (dropdownValue === validClass) {
          return validClass;
        }
      }
    }

    if(task.description) {
      const descriptionLower = task.description.replace('@', '').toLowerCase().trim();;
      // Check for "pipe fitting" with or without hyphen in description
      if (descriptionLower.includes("rigging")) {
        return "rigging-and-scaffolding";
      } else if (descriptionLower.includes("splicing rubberlining") || descriptionLower.includes("splicing-rubberlining")) {
        return "splicing-rubberlining";
      }
    }
  
    // Continue with the original tag-based extraction
    for (const text of sources) {
      // Modified regex to capture words with spaces after @ symbol
      const matches = text.match(/@([a-zA-Z0-9\s-_]+)/gi);
      if (matches) {
        for (const match of matches) {
          const candidate = match.replace("@", "").replace(/_/g, "-").toLowerCase().trim();
          // Check exact match first
          if (validExpenseClasses.includes(candidate)) {
            return candidate;
          }
          // Also check if candidate contains any valid class (for space-separated values)
          for (const validClass of validExpenseClasses) {
            if (candidate.includes(validClass)) {
              return validClass;
            }
          }
        }
      }
    }
  
    // If we didn't find any valid expense class yet, try to extract from structured name code
    const structuredNameParts = name.split("-");
    for (const part of structuredNameParts) {
      const trimmedPart = part.trim().toLowerCase();
      if (trimmedPart === "el") return "electrical";
      if (trimmedPart === "isp" || trimmedPart === "ip") return "inspector";
      if (trimmedPart === "me") return "mechanical";
      if (trimmedPart === "bm") return "boilermaking";
      if (trimmedPart === "cmb") return "condition-based-monitoring";
      if (trimmedPart === "pf") return "pipe-fitting";
      if (trimmedPart === "in") return "instrumentation";
      if (trimmedPart === "np-me") return "np-mechanical";
      if (trimmedPart === "np-bm") return "np-boilermaking";
    }
  
    return "unknown";
  };
  
  const expenseClass = extractExpenseClass();

  // Return transformed task
  return {
    ...task,
    taskID: task.taskID,
    taskName: task.name, // Rename name to taskName
    taskType: taskTypeName,
    dueDate: dueDate,
    status: status,
    expenseClass: expenseClass
    // Keep original fields as well
  };
};


// const getTasksByAssetWithAssociations = async (req, res) => {
//   const { assetName } = req.params;

//   if (!assetName) {
//     return res.status(400).json({
//       success: false,
//       error: 'Asset name is required',
//     });
//   }

//   try {
//     // const allAssets = await getAllData(`/assets/?locations=70713`, res, transformAsset);
//     const allAssets = await getAllData(`/assets/?locations=70713&name=%${assetName}%`, res, transformAsset);
    
//     // Match by includes, not strict equality
//     // const matchedAssets = allAssets.filter(
//     //   (asset) => asset.name.toLowerCase().includes(assetName.toLowerCase())
//     // );

//     // if (matchedAssets.length === 0) {
//     //   return res.status(404).json({
//     //     success: false,
//     //     error: 'No assets found matching the provided name',
//     //   });
//     // }


//     // console.log("allAssets", allAssets);
    

//     if (allAssets.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'No assets found matching the provided name',
//       });
//     }

//     // const associatedAssetIDs = matchedAssets.map((asset) => asset.assetID);
//     const associatedAssetIDs = allAssets.map((asset) => asset.assetID);

//     // const allTasks = await getAllData('/tasks/?locations=70713', res, transformTask);
//     const allTasks = await getAllData(`/tasks/?locations=70713&assets=${associatedAssetIDs}`, res, transformTask);

//     // console.log("allTasks", allTasks);
    
    
//     // const relatedTasks = allTasks.filter((task) =>
//     //   associatedAssetIDs.includes(task.assetID)
//     // );

//     // console.log("relatedTasks", relatedTasks);
    

//     // After getting allAssets and allTasks
//     const assetMap = new Map();
//     allAssets.forEach(asset => {
//       assetMap.set(asset.assetID, asset.name);
//     });

//     // Add assetName to each task
//     const enrichedTasks = allTasks.map(task => ({
//       ...task,
//       assetName: assetMap.get(task.assetID) || "Unknown Asset"
//     }));

//     res.status(200).json({
//       success: true,
//       assetName,
//       associatedAssetIDs,
//       taskCount: enrichedTasks.length,
//       data: enrichedTasks,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: 'Error fetching associated tasks',
//       details: error.message,
//     });
//   }
// };


const getTasksByAssetWithAssociations = async (req, res) => {
  const { assetName } = req.params;
  console.log("Asset Name:", assetName);
  

  if (!assetName) {
    return res.status(400).json({
      success: false,
      error: 'Asset name is required',
    });
  }

  try {
    // Transform assetName from format 1224PU123 to 1224-pu-123
    const transformedAssetName = assetName.replace(/^(\d+)([A-Z]+)(\d+)$/, (_, num1, letters, num2) => {
      return `${num1}-${letters.toLowerCase()}-${num2}`;
    });

    console.log("Transformed asset name:", transformedAssetName);
    
    // Fetch the assets based on the transformed asset name
    const allAssets = await getAllData(`/assets/?locations=70713&name=%${transformedAssetName}%`, res, transformAsset);

    if (allAssets.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No assets found matching the provided name',
      });
    }

    // Extract associated asset IDs
    const associatedAssetIDs = allAssets.map((asset) => asset.assetID);

    // Fetch tasks associated with these assets
    const allTasks = await getAllData(`/tasks/?locations=70713&assets=${associatedAssetIDs}`, res, transformTask);

    // Create a map of assetID to assetName
    const assetMap = new Map();
    allAssets.forEach(asset => {
      assetMap.set(asset.assetID, asset.name);
    });

    // Add assetName to each task
    const enrichedTasks = allTasks.map(task => ({
      ...task,
      assetName: assetMap.get(task.assetID) || "Unknown Asset"
    }));

    console.log("Enriched tasks:", enrichedTasks);
    

    res.status(200).json({
      success: true,
      assetName: transformedAssetName,
      associatedAssetIDs,
      taskCount: enrichedTasks.length,
      data: enrichedTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching associated tasks',
      details: error.message,
    });
  }
};


// Expose other base handlers
// const getAllAssets = (req, res) => getAllData('/assets', res, transformAsset);
// const getAllLocations = (req, res) => getAllData('/locations', res);
// const getAllTasks = (req, res) => getAllData('/tasks', res);

// Export all functions
module.exports = {
  // getAllAssets,
  // getAllLocations,
  // getAllTasks,
  getTasksByAssetWithAssociations
};