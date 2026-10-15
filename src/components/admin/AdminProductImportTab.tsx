import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import {
  api,
  IMPORT_PRODUCT_CATEGORIES,
  ImportedProduct,
  ProductImportResult,
} from '../../services/api';

interface PreviewRow {
  rowNumber: number;
  product: ImportedProduct;
  imagePath: string;
  errors: string[];
}

interface ImportReport extends ProductImportResult {
  invalid: number;
}

const REQUIRED_COLUMNS = ['ref', 'nom', 'prix_tnd', 'categorie'] as const;
const OPTIONAL_COLUMNS = ['image', 'source', 'remarque'] as const;
const PLACEHOLDER_IMAGE = '/logo.jpg';

const cellText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const parsePrice = (value: unknown): number | null => {
  const text = cellText(value).replace(/\s/g, '');
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) return null;
  const price = Number(text.replace(',', '.'));
  return Number.isFinite(price) && price >= 0 ? price : null;
};

const imagePathFor = (image: string) =>
  image ? `/products/${image.replace(/^\/+/, '')}` : PLACEHOLDER_IMAGE;

export const AdminProductImportTab: React.FC<{ onImportComplete?: () => void }> = ({
  onImportComplete,
}) => {
  const { user } = useAuth();
  const { showToast, refreshProducts } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [report, setReport] = useState<ImportReport | null>(null);

  const validRows = useMemo(() => rows.filter((row) => row.errors.length === 0), [rows]);
  const invalidRows = useMemo(() => rows.filter((row) => row.errors.length > 0), [rows]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
        L’import des produits est réservé aux administrateurs.
      </div>
    );
  }

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setFileName(file.name);
    setRows([]);
    setParseError('');
    setReport(null);

    if (!/\.xlsx$/i.test(file.name)) {
      setParseError('Sélectionnez un fichier Excel .xlsx.');
      return;
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets.Produits;
      if (!sheet) throw new Error('Le classeur ne contient pas de feuille « Produits ».');

      const values = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false,
      }) as unknown[][];
      if (values.length === 0) throw new Error('La feuille « Produits » est vide.');

      const headers = values[0].map((value) => cellText(value).toLocaleLowerCase());
      const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
      if (missingColumns.length > 0) {
        throw new Error(`Colonnes obligatoires absentes : ${missingColumns.join(', ')}.`);
      }

      const columnIndex = new Map(headers.map((header, index) => [header, index]));
      const parsedRows = values.slice(1)
        .map((valuesRow, index) => {
          const hasContent = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].some((header) =>
            cellText(valuesRow[columnIndex.get(header) ?? -1]) !== '',
          );
          if (!hasContent) return null;

          const valueFor = (header: string) =>
            cellText(valuesRow[columnIndex.get(header) ?? -1]);
          const ref = valueFor('ref');
          const name = valueFor('nom');
          const rawPrice = valueFor('prix_tnd');
          const category = valueFor('categorie');
          const image = valueFor('image');
          const priceTND = parsePrice(rawPrice);
          const errors: string[] = [];

          if (!ref) errors.push('Référence vide (colonne ref).');
          if (!name) errors.push('Nom vide.');
          if (priceTND === null) errors.push('Prix non numérique ou négatif.');
          if (!IMPORT_PRODUCT_CATEGORIES.some(
            (knownCategory) => knownCategory.toLocaleLowerCase() === category.toLocaleLowerCase(),
          )) {
            errors.push(`Catégorie inconnue : ${category || '(vide)'}.`);
          }

          return {
            rowNumber: index + 2,
            product: {
              ref,
              name,
              priceTND: priceTND ?? 0,
              category,
              image,
            },
            imagePath: imagePathFor(image),
            errors,
          };
        })
        .filter((row): row is PreviewRow => row !== null);

      const refCounts = new Map<string, number>();
      parsedRows.forEach(({ product }) => {
        if (product.ref) refCounts.set(product.ref, (refCounts.get(product.ref) ?? 0) + 1);
      });
      parsedRows.forEach((row) => {
        if (row.product.ref && (refCounts.get(row.product.ref) ?? 0) > 1) {
          row.errors.push('Référence présente plusieurs fois dans le fichier.');
        }
      });

      if (parsedRows.length === 0) throw new Error('Aucune ligne produit à prévisualiser.');
      setRows(parsedRows);
      const missingOptionalColumns = OPTIONAL_COLUMNS.filter((column) => !headers.includes(column));
      if (missingOptionalColumns.length > 0) {
        showToast(`Colonnes facultatives absentes : ${missingOptionalColumns.join(', ')}.`, 'info');
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Impossible de lire ce fichier Excel.');
    }
  };

  const confirmImport = async () => {
    if (validRows.length === 0 || isImporting) return;

    setIsImporting(true);
    setReport(null);
    setProgress({ completed: 0, total: validRows.length });
    try {
      const result = await api.productImport.import(
        validRows.map((row) => row.product),
        (completed, total) => setProgress({ completed, total }),
      );
      setReport({ ...result, invalid: invalidRows.length });
      await refreshProducts();
      onImportComplete?.();
      showToast('Import terminé. Consultez le rapport pour le détail.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de l’import Firestore.';
      setReport({
        created: 0,
        updated: 0,
        failed: validRows.length,
        invalid: invalidRows.length,
        errors: [{ ref: '*', message }],
      });
      showToast(message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          Importer des produits
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Importez la feuille « Produits » d’un classeur .xlsx. Les images restent dans
          {' '}<code className="rounded bg-slate-100 px-1">public/products/</code> et ne sont pas téléversées.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFile}
            className="hidden"
            aria-label="Choisir un fichier Excel"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Choisir un fichier .xlsx
          </button>
          {fileName && <span className="text-sm text-slate-600">{fileName}</span>}
        </div>
        {parseError && (
          <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {parseError}
          </p>
        )}
      </header>

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <div>
              <h3 className="font-bold text-slate-900">Aperçu avant import</h3>
              <p className="text-xs text-slate-500">
                {rows.length} ligne(s) · {validRows.length} valide(s) · {invalidRows.length} avec erreur(s)
              </p>
            </div>
            <button
              type="button"
              onClick={() => void confirmImport()}
              disabled={isImporting || validRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isImporting ? 'Import en cours…' : `Importer ${validRows.length} produit(s) valide(s)`}
            </button>
          </div>

          {isImporting && (
            <div className="space-y-2 border-b border-slate-100 px-4 py-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Écriture dans Firestore</span>
                <span>{progress.completed} / {progress.total}</span>
              </div>
              <progress className="h-2 w-full accent-orange-600" max={progress.total || 1} value={progress.completed} />
            </div>
          )}

          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ligne</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Prix (TND)</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.product.ref}`} className={row.errors.length ? 'bg-rose-50/70' : ''}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{row.rowNumber}</td>
                    <td className="min-w-48 px-4 py-3 font-medium text-slate-900">{row.product.name || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.product.priceTND}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.product.category || '—'}</td>
                    <td className="max-w-64 break-all px-4 py-3 font-mono text-xs text-slate-600">{row.imagePath}</td>
                    <td className="min-w-56 px-4 py-3">
                      {row.errors.length === 0
                        ? <span className="text-emerald-700">Valide</span>
                        : <ul className="list-inside list-disc text-xs text-rose-700">
                            {row.errors.map((error) => <li key={error}>{error}</li>)}
                          </ul>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5" aria-live="polite">
          <h3 className="font-bold text-slate-900">Rapport d’import</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ReportCount label="Créés" value={report.created} color="text-emerald-700" />
            <ReportCount label="Mis à jour" value={report.updated} color="text-blue-700" />
            <ReportCount label="Échoués" value={report.failed} color="text-rose-700" />
            <ReportCount label="Invalides ignorés" value={report.invalid} color="text-amber-700" />
          </div>
          {report.errors.length > 0 && (
            <ul className="max-h-52 list-inside list-disc overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-800">
              {report.errors.map((error, index) => (
                <li key={`${error.ref}-${index}`}>{error.ref}: {error.message}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  );
};

const ReportCount: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs text-slate-500">{label}</p>
    <p className={`mt-1 text-xl font-black ${color}`}>{value}</p>
  </div>
);
