// services/csvService.js
const fs = require("fs");
const csv = require("csv-parser");
const Esop = require("../models/Esop");
const { ValidationError, DatabaseError } = require("../utils/errors");
const { validateCsvData } = require("../middleware/validation");
const { csvRowSchema } = require("../validators/esopValidators");

function toInt(value) {
  if (value === null || value === undefined) return 0;
  const num = parseInt(String(value).replace(/,/g, ""), 10);
  return Number.isNaN(num) ? 0 : num;
}

function toFloat(value) {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(String(value).replace(/,/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

function parseDate(dateString) {
  if (dateString === null || dateString === undefined) {
    return null;
  }

  let raw = dateString;

  if (typeof raw !== 'string') {
    raw = String(raw);
  }

  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  // Ignore obvious Excel placeholders like #########
  if (/^#+$/.test(trimmed)) {
    console.log(`  Skipping invalid Excel placeholder date: ${trimmed}`);
    return null;
  }

  console.log(`Parsing date string: ${trimmed}`);

  // Excel serial date support (e.g., 45234)
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = Number(trimmed);
    if (!Number.isNaN(serial) && serial > 1000 && serial < 60000) {
      const jsTime = (serial - 25569) * 24 * 60 * 60 * 1000;
      const serialDate = new Date(jsTime);
      if (!isNaN(serialDate.getTime())) {
        console.log(`  Successfully parsed as Excel serial date: ${serialDate.toISOString()}`);
        return serialDate;
      }
    }
  }

  // Try standard ISO-like formats first (YYYY-MM-DD, etc.)
  let date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    console.log(`  Successfully parsed as native date: ${date.toISOString()}`);
    return date;
  }

  // Handle MM/DD/YYYY
  const partsSlash = trimmed.split('/');
  if (partsSlash.length === 3) {
    const [mm, dd, yyyy] = partsSlash;
    date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(date.getTime())) {
      console.log(`  Successfully parsed as MM/DD/YYYY: ${date.toISOString()}`);
      return date;
    }
  }

  // Handle DD-MM-YYYY and YYYY-MM-DD explicitly
  const partsDash = trimmed.split('-');
  if (partsDash.length === 3) {
    if (partsDash[0].length === 4) {
      // YYYY-MM-DD
      const [yyyy, mm, dd] = partsDash;
      date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    } else {
      // DD-MM-YYYY
      const [dd, mm, yyyy] = partsDash;
      date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    }
    if (!isNaN(date.getTime())) {
      console.log(`  Successfully parsed as dashed date: ${date.toISOString()}`);
      return date;
    }
  }

  console.log(`  Failed to parse date string: ${trimmed}`);
  return null; // Return null if all parsing fails
}

async function parseAndSaveEsopCSV(filePath, userId) {
  return new Promise((resolve, reject) => {
    console.log(`Starting to parse CSV file: ${filePath} for user: ${userId}`);
    const results = [];
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        rowCount++;
        console.log(`Processing row ${rowCount}:`, JSON.stringify(data).substring(0, 100) + '...');
        
        // ----- Flexible parsing with fallbacks and logging -----
        const quantity = toInt(
          data.quantity ||
          data.totalGrants ||
          data.total_grants ||
          data.grants ||
          data.total ||
          data['Total Options']
        );

        let totalGrants = quantity;

        let vested = toInt(data.vested || data.Vested);
        let unvested = toInt(data.unvested || data.Unvested);
        let exercised = toInt(data.exercised || data.Exercised);

        const strikePrice = toFloat(
          data.strikePrice ||
          data.strike_price ||
          data['Strike Price']
        );

        const exercisePrice = toFloat(
          data.exercisePrice ||
          data.exercise_price ||
          // Some older files used "price" as the strike/exercise price
          (!strikePrice ? data.price : undefined)
        );

        const avgStockPrice = toFloat(
          data.avgStockPrice ||
          data.avg_stock_price ||
          data['Avg Stock Price'] ||
          data.fmv ||
          data['FMV']
        );

        const statusFromCsv = (data.status || data.Status || "").trim();
        let status = statusFromCsv;

        if (!status) {
          if (exercised > 0) {
            status = "Exercised";
          } else if (vested > 0 && unvested <= 0) {
            status = "Vested";
          } else if (unvested > 0 && vested <= 0) {
            status = "Unvested";
          } else {
            status = "Not exercised";
          }
        }

        // If vested/unvested not provided, derive from status + quantity
        if (vested === 0 && unvested === 0 && quantity > 0) {
          if (status === 'Vested' || status === 'Exercised' || status === 'Sold') {
            vested = quantity;
            unvested = 0;
            if (status === 'Exercised' || status === 'Sold') {
              exercised = quantity;
            }
          } else if (status === 'Unvested') {
            vested = 0;
            unvested = quantity;
          }
        }

        const ticker = (data.ticker || data.symbol || data.Ticker || data['Ticker Symbol'] || "N/A").toString().toUpperCase();
        const company = data.company || data.companyName || data['Company Name'] || "";

        const grantDate = parseDate(data.grantDate || data.grant_date || data['Grant Date']);
        const vestingStartDate = parseDate(data.vestingStartDate || data.vesting_start_date || data['Vesting Start Date']);
        const vestingEndDate = parseDate(data.vestingEndDate || data.vesting_end_date || data['Vesting End Date']);
        const expirationDate = parseDate(data.expirationDate || data.expiration_date || data['Expiration Date']);
        const exerciseDate = parseDate(data.exerciseDate || data.exercise_date || data['Exercise Date']);

        const type = data.type || data.option_type || data.grantType || data['Grant Type'] || "ISO";
        const vestingSchedule = data.vestingSchedule || data.vesting_schedule || data['Vesting Schedule'] || "Standard";
        const notes = data.notes || data.comments || data['Notes'] || "";

        const salePrice = toFloat(
          data.salePrice ||
          data.sale_price ||
          data['Sale Price']
        );

        const saleDate = parseDate(
          data.saleDate ||
          data.sale_date ||
          data['Sale Date']
        );

        // Prefer explicit current price if provided, otherwise fall back to avgStockPrice or strikePrice
        const currentPrice = toFloat(
          data.currentPrice ||
          data.current_price ||
          data['Current Price'] ||
          avgStockPrice ||
          0
        );

        const fmv = toFloat(
          data.fmv ||
          data['FMV'] ||
          avgStockPrice ||
          0
        );

        const processedRow = {
          userId,

          // Identification
          ticker,
          company,

          // Dates
          grantDate,
          vestingStartDate,
          vestingEndDate,
          vestingSchedule,
          expirationDate,
          exerciseDate,

          // Quantities
          totalGrants,
          quantity,
          vested,
          unvested,
          exercised,

          // Pricing
          strikePrice,
          exercisePrice,
          avgStockPrice,
          currentPrice,
          fmv,
          // legacy fallback used by some analytics services
          price: exercisePrice || strikePrice || 0,

          // Realized sale information (for Sold status)
          salePrice,
          saleDate,

          // Classification & status
          type,
          status,
          notes,
        };
        
        console.log(
          `Processed row ${rowCount}: ` +
          `ticker=${processedRow.ticker}, ` +
          `company=${processedRow.company}, ` +
          `quantity=${processedRow.quantity}, ` +
          `strikePrice=${processedRow.strikePrice}, ` +
          `status=${processedRow.status}`
        );
          
        results.push(processedRow);
      })
      .on("end", async () => {
        try {
          console.log(`CSV parsing complete. Parsed ${results.length} records`);
          
          // Before deletion, verify what will be deleted
          const existingRecords = await Esop.find({ userId }).countDocuments();
          console.log(`Found ${existingRecords} existing records for deletion`);
          
          // Delete existing records with explicit confirmation
          console.log(`Deleting existing records for user ${userId}...`);
          const deleteResult = await Esop.deleteMany({ userId });
          console.log(`Deleted ${deleteResult.deletedCount} old records for user ${userId}`);
          
          // Insert new records with explicit confirmation
          console.log(`Inserting ${results.length} new records...`);
          const savedResults = await Esop.insertMany(results);
          console.log(`Successfully inserted ${savedResults.length} new records`);
          
          if (savedResults.length > 0) {
            console.log('First saved record:', JSON.stringify(savedResults[0]).substring(0, 200) + '...');
          }
          
          resolve({ data: savedResults, validationPassed: true });
        } catch (err) {
          console.error('Database save error:', err);
          reject(new DatabaseError(`Failed to save ESOP data: ${err.message}`));
        }
      })
      .on("error", (err) => {
        console.error('CSV parsing error:', err);
        reject(err);
      });
  });
}

module.exports = {
  parseAndSaveEsopCSV,
};
