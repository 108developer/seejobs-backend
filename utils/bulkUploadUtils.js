import csv from "csv-parser";
import path from "path";
import { Readable } from "stream";
import xlsx from "xlsx";

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

      if (fileExtension === ".xlsx" || fileExtension === ".xls") {
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
          message: `${newRecords.length} record(s) uploaded successfully. ${
            duplicateRecords.length
              ? `${duplicateRecords.length} duplicate(s) skipped.`
              : ""
          }`,
          data: newRecords,
          duplicates: duplicateRecords,
        });
      } catch (error) {
        if (
          error.name === "BulkWriteError" &&
          error.writeErrors?.some((e) => e.code === 11000)
        ) {
          console.error("Duplicate key error:", error.message);
          return res.status(400).json({
            message:
              "Some records already exist in the database and were skipped.",
            error: error.message ?? "Duplicate key error",
            duplicates: duplicateRecords,
          });
        }
        console.error("InsertMany error:", error.message);
        res.status(500).json({
          message:
            "Failed to upload data due to insertion error. Data already exist.",
          error: error.message ?? "Unexpected server error",
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

// Fixed bulkUploadCandidatesUtils to handle unique key as object fields
export const bulkUploadCandidatesUtils = (
  expectedHeaders,
  Model,
  mapRowToModel
) => {
  return async (req, res) => {
    const uploadedFiles = req.files; // <--- CHANGE: handle multiple files (req.files)

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: "No files uploaded" }); // <--- validate
    }

    const normalizeHeaders = (headers) =>
      headers.map((h) => h.toLowerCase().trim());

    const validateHeaders = (row) => {
      const headersInFile = normalizeHeaders(Object.keys(row));
      return Object.values(expectedHeaders).every((aliases) =>
        aliases.some((h) => headersInFile.includes(h.toLowerCase()))
      );
    };

    const parseExcel = async (buffer) => {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(sheet);
      if (!jsonData.length || !validateHeaders(jsonData[0])) {
        throw new Error("Invalid or missing headers in Excel file");
      }
      return jsonData.map(mapRowToModel);
    };

    const parseCSV = (buffer) =>
      new Promise((resolve, reject) => {
        const data = [];
        Readable.from(buffer)
          .pipe(csv())
          .on("data", (row) => data.push(mapRowToModel(row)))
          .on("end", () => resolve(data))
          .on("error", reject);
      });

    let allParsedData = [];
    let allDuplicates = [];

    try {
      for (const file of uploadedFiles) {
        // <--- loop over each uploaded file
        const fileBuffer = file.buffer;
        const fileExtension = path.extname(file.originalname).toLowerCase();

        let parsedData = [];

        if (fileExtension === ".xlsx" || fileExtension === ".xls") {
          parsedData = await parseExcel(fileBuffer);
        } else if (fileExtension === ".csv") {
          parsedData = await parseCSV(fileBuffer);
        } else {
          return res.status(400).json({
            message: `Invalid file type in ${file.originalname}. Upload .xlsx or .csv only.`,
          });
        }

        const existingDocs = await Model.find({
          $or: parsedData.map((record) => ({
            "registration.email": record.registration.email,
            "registration.phone": record.registration.phone,
          })),
        }).lean();

        const existingValues = new Set(
          existingDocs.map(
            (doc) => `${doc.registration.email}|${doc.registration.phone}`
          )
        );

        const newRecords = parsedData.filter(
          (record) =>
            !existingValues.has(
              `${record.registration.email}|${record.registration.phone}`
            )
        );

        const duplicateRecords = parsedData.filter((record) =>
          existingValues.has(
            `${record.registration.email}|${record.registration.phone}`
          )
        );

        allParsedData.push(...newRecords);
        allDuplicates.push(...duplicateRecords);
      }

      if (!allParsedData.length) {
        return res.status(400).json({
          message: "No new records to add. All entries already exist.",
          duplicates: allDuplicates,
        });
      }

      try {
        await Model.insertMany(allParsedData, { ordered: false }); // <--- insert all
        res.status(201).json({
          success: true,
          message: `${allParsedData.length} record(s) uploaded successfully. ${
            allDuplicates.length
              ? `${allDuplicates.length} duplicate(s) skipped.`
              : ""
          }`,
          data: allParsedData,
          duplicates: allDuplicates.map(
            (d) => d.registration?.email || "unknown"
          ),
        });
      } catch (error) {
        if (
          error.name === "BulkWriteError" &&
          error.writeErrors?.some((e) => e.code === 11000)
        ) {
          console.error("Duplicate key error:", error.message);
          return res.status(400).json({
            message:
              "Some records already exist in the database and were skipped.",
            error: error.message ?? "Duplicate key error",
            duplicates: allDuplicates,
          });
        }
        console.error("InsertMany error:", error.message);
        res.status(500).json({
          message:
            "Failed to upload data due to insertion error. Some records may already exist.",
          error: error.message ?? "Unexpected server error",
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

// Fixed bulkUploadCandidates to pass the correct reference
