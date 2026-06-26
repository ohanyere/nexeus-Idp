import type { ReactNode } from "react";

type DataTableProps = {
 columns: string[];
 rows: Array<Record<string, ReactNode>>;
};

export function DataTable({ columns, rows }: DataTableProps) {
 return (
 <div className="console-panel min-w-0 overflow-hidden rounded-md">
 <div className="max-w-full overflow-x-auto">
 <table className="min-w-[760px] divide-y divide-line">
 <thead className="bg-canvas">
 <tr>
 {columns.map((column) => (
 <th
 key={column}
 scope="col"
 className="px-4 py-2.5 text-left text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted"
 >
 {column}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-line bg-white">
 {rows.map((row, index) => (
 <tr key={index} className="hover:bg-canvas">
 {columns.map((column) => (
 <td key={column} className="max-w-sm px-4 py-3 align-top text-xs leading-5 text-slate-700">
 {row[column]}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
