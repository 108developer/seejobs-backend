import path from "path";
import xlsx from "xlsx";
import csv from "csv-parser";
import { Readable } from "stream";

export const bulkUploadUtils = (
  expectedHeaders,
  Model,
  uniqueKey,
  mapRowToModel
) => {
  return async (req, res) => {
    const fileBuffer = req.file?.buffer;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (!fileBuffer) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      let parsedData = [];

      const normalizeHeaders = (headers) =>
        headers.map((h) => h.toLowerCase().trim());

      const validateHeaders = (row) => {
        const headersInFile = normalizeHeaders(Object.keys(row));
        return expectedHeaders.every((h) =>
          headersInFile.includes(h.toLowerCase())
        );
      };

      const parseExcel = async () => {
        const workbook = xlsx.read(fileBuffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        if (!jsonData.length || !validateHeaders(jsonData[0])) {
          throw new Error("Invalid or missing headers in Excel file");
        }
        return jsonData.map(mapRowToModel);
      };

      const parseCSV = () =>
        new Promise((resolve, reject) => {
          const data = [];
          Readable.from(fileBuffer)
            .pipe(csv())
            .on("data", (row) => data.push(mapRowToModel(row)))
            .on("end", () => resolve(data))
            .on("error", reject);
        });

      if (fileExtension === ".xlsx") {
        parsedData = await parseExcel();
      } else if (fileExtension === ".csv") {
        parsedData = await parseCSV();
      } else {
        return res.status(400).json({
          message: "Invalid file type. Please upload a .xlsx or .csv file.",
        });
      }

      const existingDocs = await Model.find({
        [uniqueKey]: { $in: parsedData.map((doc) => doc[uniqueKey]) },
      }).lean();

      const existingValues = new Set(existingDocs.map((doc) => doc[uniqueKey]));

      const newRecords = parsedData.filter(
        (record) => !existingValues.has(record[uniqueKey])
      );

      const duplicateRecords = parsedData.filter((record) =>
        existingValues.has(record[uniqueKey])
      );

      if (!newRecords.length) {
        return res.status(400).json({
          message: "No new records to add. All entries already exist.",
          duplicates: duplicateRecords,
        });
      }

      try {
        await Model.insertMany(newRecords, { ordered: false });
        res.status(201).json({
          success: true,
          message: `${newRecords.length} record(s) uploaded successfully!`,
          data: newRecords,
          duplicates: duplicateRecords,
        });
      } catch (error) {
        if (error.code === 11000) {
          console.error("Duplicate key error:", error.message);
          return res.status(400).json({
            message:
              "Some records already exist in the database and were skipped.",
            error: error.message,
            duplicates: duplicateRecords,
          });
        }
        console.error("InsertMany error:", error);
        res.status(500).json({
          message: "Failed to upload data due to insertion error.",
          error: error.message,
        });
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      res.status(500).json({
        message: "Failed to upload data.",
        error: error.message,
      });
    }
  };
};
