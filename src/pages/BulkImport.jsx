import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { rtdb } from "../firebase";
import { ref, get, push, set } from "firebase/database";

// ── Icons ──────────────────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg
    className="w-10 h-10"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
    />
  </svg>
);
const DownloadIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);
const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-green-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 12.75 6 6 9-13.5"
    />
  </svg>
);
const WarnIcon = () => (
  <svg
    className="w-4 h-4 text-amber-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
    />
  </svg>
);
const ErrorIcon = () => (
  <svg
    className="w-4 h-4 text-red-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
    />
  </svg>
);

const REQUIRED_COLUMNS = [
  "product_name",
  "category_name",
  "product_price",
  "product_quantity",
  "product_unit",
];
const ALL_COLUMNS = [
  ...REQUIRED_COLUMNS,
  "product_description",
  "product_image",
  "trending_item",
];

function downloadTemplate(categories) {
  const sample =
    categories.length > 0 ? categories[0].category_title : "Fruits";
  const ws = XLSX.utils.aoa_to_sheet([
    ALL_COLUMNS,
    [
      "Sample Apple",
      sample,
      2.99,
      50,
      "1 kg",
      "Fresh and juicy apple",
      "https://example.com/apple.jpg",
      true,
    ],
    [
      "Sample Banana",
      sample,
      1.49,
      100,
      "500g",
      "Sweet ripe banana",
      "",
      false,
    ],
  ]);
  ws["!cols"] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 30 },
    { wch: 40 },
    { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, "bulk_import_template.xlsx");
}

function validateRow(raw, categories) {
  const errors = [];
  const warnings = [];

  const name = String(raw.product_name ?? "").trim();
  const catName = String(raw.category_name ?? "").trim();
  const price = raw.product_price;
  const qty = raw.product_quantity;
  const unit = String(raw.product_unit ?? "").trim();

  if (!name) errors.push("product_name is required");
  if (!catName) errors.push("category_name is required");
  if (price === undefined || price === "" || isNaN(Number(price)))
    errors.push("product_price must be a number");
  if (qty === undefined || qty === "" || isNaN(Number(qty)))
    errors.push("product_quantity must be a number");
  if (!unit) errors.push("product_unit is required (e.g. 1 kg, 500g)");

  const matchedCat = categories.find(
    (c) =>
      String(c.category_title).trim().toLowerCase() === catName.toLowerCase(),
  );

  if (!matchedCat && catName) {
    warnings.push(`Category "${catName}" not found — row will be skipped`);
  }

  return { errors, warnings, matchedCat: matchedCat || null };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function BulkImport() {
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);

  // FIX 1: Keep a ref that always mirrors the latest `rows` state.
  // This prevents stale-closure bugs inside the async handleImport.
  const rowsRef = useRef([]);
  const isMounted = useRef(true);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fileInputRef = useRef(null);

  // Keep rowsRef in sync
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch categories once
  useEffect(() => {
    (async () => {
      try {
        const snap = await get(ref(rtdb, "category"));
        const data = [];
        if (snap.exists())
          snap.forEach((c) => data.push({ id: c.key, ...c.val() }));
        if (isMounted.current) setCategories(data);
      } catch (e) {
        console.error("Failed to load categories", e);
      } finally {
        if (isMounted.current) setCatLoading(false);
      }
    })();
  }, []);

  // ── Parse uploaded file ────────────────────────────────────────────────────
  const parseFile = useCallback((file, cats) => {
    setImportResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (jsonData.length === 0) {
          const parsed = [
            {
              raw: {},
              errors: ["The sheet is empty."],
              warnings: [],
              matchedCat: null,
            },
          ];
          setRows(parsed);
          return;
        }

        const headers = Object.keys(jsonData[0]);
        const missingHeaders = REQUIRED_COLUMNS.filter(
          (h) => !headers.includes(h),
        );
        if (missingHeaders.length > 0) {
          const parsed = [
            {
              raw: {},
              errors: [
                `Missing required columns: ${missingHeaders.join(", ")}`,
              ],
              warnings: [],
              matchedCat: null,
            },
          ];
          setRows(parsed);
          return;
        }

        const validated = jsonData.map((raw) => {
          const { errors, warnings, matchedCat } = validateRow(raw, cats);
          return { raw, errors, warnings, matchedCat };
        });
        setRows(validated);
      } catch (err) {
        setRows([
          {
            raw: {},
            errors: ["Failed to parse file: " + err.message],
            warnings: [],
            matchedCat: null,
          },
        ]);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file, categories);
    },
    [parseFile, categories],
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) parseFile(file, categories);
    e.target.value = "";
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  // FIX 2: Read from rowsRef (not stale closure rows).
  // FIX 3: setImporting(false) is ALWAYS called via finally.
  // FIX 4: NO per-row setProgress — avoids triggering 50+ re-renders of the
  //         big preview table. We show a simple spinner instead.
  const handleImport = async () => {
    const currentRows = rowsRef.current;
    const validRows = currentRows.filter(
      (r) => r.errors.length === 0 && r.matchedCat,
    );
    if (validRows.length === 0) return;

    setImporting(true);
    setImportResult(null);

    let success = 0;
    let failed = 0;

    try {
      for (let i = 0; i < validRows.length; i++) {
        const { raw, matchedCat } = validRows[i];
        try {
          const newRef = push(ref(rtdb, "products"));
          await set(newRef, {
            product_id: newRef.key,
            product_name: String(raw.product_name ?? "").trim(),
            product_description: raw.product_description
              ? String(raw.product_description).trim()
              : "",
            product_price: Number(raw.product_price),
            product_quantity: Number(raw.product_quantity),
            product_unit: raw.product_unit
              ? String(raw.product_unit).trim()
              : "",
            product_image: raw.product_image
              ? String(raw.product_image).trim()
              : "",
            category_id: matchedCat.id,
            category_name: matchedCat.category_title,
            trending_item:
              raw.trending_item === true ||
              String(raw.trending_item).toLowerCase() === "true",
          });
          success++;
        } catch (err) {
          console.error("Row import failed:", err);
          failed++;
        }
      }
    } finally {
      // FIX 5: Clear rows AFTER import so the stale preview table doesn't
      //         re-render dozens of times during state flush.
      if (isMounted.current) {
        const skipped = rowsRef.current.length - validRows.length;
        setRows([]);
        setFileName("");
        setImportResult({ success, skipped, failed });
        setImporting(false);
      }
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleClear = () => {
    setRows([]);
    setFileName("");
    setImportResult(null);
  };

  // ── Derived values (only used for preview, not during import loop) ─────────
  const readyCount = rows.filter(
    (r) => r.errors.length === 0 && r.matchedCat,
  ).length;
  const warnCount = rows.filter(
    (r) => r.errors.length === 0 && !r.matchedCat && r.warnings.length > 0,
  ).length;
  const errorCount = rows.filter((r) => r.errors.length > 0).length;
  const hasHardErrors = errorCount > 0;

  const rowStatus = (row) => {
    if (row.errors.length > 0) return "error";
    if (!row.matchedCat) return "warn";
    return "ok";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bulk Product Import
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload an Excel or CSV file to add multiple products at once.
          </p>
        </div>
        <button
          onClick={() => downloadTemplate(categories)}
          disabled={catLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
        >
          <DownloadIcon />
          Download Template
        </button>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            step: "1",
            title: "Download Template",
            desc: "Get the pre-built Excel template with correct column headers.",
          },
          {
            step: "2",
            title: "Fill in Products",
            desc: "Add your rows. Category name must match exactly.",
          },
          {
            step: "3",
            title: "Upload & Import",
            desc: "Upload the file, review the preview, then click Import.",
          },
        ].map(({ step, title, desc }) => (
          <div
            key={step}
            className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 shadow-sm"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center text-sm font-bold">
              {step}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Column info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">
          Required Column Headers
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_COLUMNS.map((col) => (
            <code
              key={col}
              className={`px-2 py-0.5 rounded text-xs font-mono ${
                REQUIRED_COLUMNS.includes(col)
                  ? "bg-blue-100 text-blue-900 border border-blue-300"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {col}
              {REQUIRED_COLUMNS.includes(col) ? " *" : ""}
            </code>
          ))}
        </div>
        <p className="text-xs text-blue-700 mt-2">
          * Required &nbsp;&middot;&nbsp;
          <code className="font-mono">category_name</code> must match an
          existing category title (case-insensitive).
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !importing && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 transition-all duration-200 ${
          importing
            ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
            : dragging
              ? "border-[#2563EB] bg-blue-50 scale-[1.01] cursor-pointer"
              : "border-gray-300 bg-white hover:border-[#2563EB] hover:bg-blue-50/40 cursor-pointer"
        }`}
      >
        <div
          className={`transition-colors ${dragging ? "text-[#2563EB]" : "text-gray-400"}`}
        >
          <UploadIcon />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {fileName ? (
              <span className="text-[#2563EB] font-semibold">{fileName}</span>
            ) : (
              <>
                <span className="text-[#2563EB] font-semibold">
                  Click to browse
                </span>{" "}
                or drag &amp; drop
              </>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, or .csv</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Importing spinner */}
      {importing && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-[#2563EB] rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Importing products to Firebase…
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Please wait, do not close this page.
            </p>
          </div>
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && !importing && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {rows.length} row{rows.length !== 1 ? "s" : ""} parsed
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <CheckIcon /> {readyCount} ready
            </div>
            {warnCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <WarnIcon /> {warnCount} skipped
              </div>
            )}
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                <ErrorIcon /> {errorCount} error{errorCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Trending
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Issues
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => {
                  const status = rowStatus(row);
                  return (
                    <tr
                      key={i}
                      className={`transition-colors ${
                        status === "error"
                          ? "bg-red-50/60"
                          : status === "warn"
                            ? "bg-amber-50/60"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">
                        {status === "ok" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <CheckIcon /> Valid
                          </span>
                        )}
                        {status === "warn" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <WarnIcon /> Skip
                          </span>
                        )}
                        {status === "error" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <ErrorIcon /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">
                        {String(row.raw.product_name ?? "—")}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs ${!row.matchedCat && row.raw.category_name ? "text-red-600 font-medium" : "text-gray-600"}`}
                      >
                        {String(row.raw.category_name ?? "—")}
                        {!row.matchedCat && row.raw.category_name && (
                          <span className="block text-red-400 text-[10px]">
                            not found
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {row.raw.product_price !== ""
                          ? `${Number(row.raw.product_price).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {row.raw.product_quantity !== ""
                          ? String(row.raw.product_quantity)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {row.raw.product_unit
                          ? String(row.raw.product_unit)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {row.raw.trending_item === true ||
                        String(row.raw.trending_item).toLowerCase() ===
                          "true" ? (
                          <span className="text-green-600 font-medium">
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        {[...row.errors, ...row.warnings].length === 0 ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : (
                          <ul className="space-y-0.5">
                            {row.errors.map((e, j) => (
                              <li
                                key={`e-${j}`}
                                className="text-xs text-red-600"
                              >
                                {e}
                              </li>
                            ))}
                            {row.warnings.map((w, j) => (
                              <li
                                key={`w-${j}`}
                                className="text-xs text-amber-600"
                              >
                                {w}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleImport}
              disabled={readyCount === 0 || hasHardErrors}
              className={`px-6 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all duration-200 ${
                readyCount === 0 || hasHardErrors
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#2563EB] hover:bg-blue-700 hover:shadow-md active:scale-95"
              }`}
            >
              Import {readyCount} Product{readyCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* Import result */}
      {importResult && !importing && (
        <div
          className={`rounded-xl border p-5 flex items-start gap-4 shadow-sm ${
            importResult.failed > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
              importResult.failed > 0 ? "bg-amber-100" : "bg-green-100"
            }`}
          >
            {importResult.failed > 0 ? "⚠️" : "✅"}
          </div>
          <div>
            <p className="font-semibold text-gray-900">Import Complete</p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="text-green-700 font-medium">
                {importResult.success} product
                {importResult.success !== 1 ? "s" : ""} imported successfully
              </span>
              {importResult.skipped > 0 && (
                <span className="text-amber-600">
                  {" "}
                  &middot; {importResult.skipped} skipped (category not found)
                </span>
              )}
              {importResult.failed > 0 && (
                <span className="text-red-600">
                  {" "}
                  &middot; {importResult.failed} failed (check console)
                </span>
              )}
            </p>
            <button
              onClick={() => setImportResult(null)}
              className="mt-3 text-xs text-gray-500 underline hover:text-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
