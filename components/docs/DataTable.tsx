interface TableCell {
    code?: string;
    label?: string;
    value?: string;
}

interface DataTableProps {
    headers: string[];
    rows: TableCell[][];
}

export function DataTable({ headers, rows }: DataTableProps) {
    return (
        <div className="border border-border rounded-lg overflow-hidden mb-8">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[400px]">
                    <thead>
                        <tr>
                            {headers.map((header, idx) => (
                                <th
                                    key={idx}
                                    className="bg-secondary text-left px-4 sm:px-6 py-3 text-xs text-muted-foreground font-semibold border-b border-border whitespace-nowrap"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIdx) => (
                            <tr key={rowIdx} className="border-b border-border last:border-0">
                                {row.map((cell, cellIdx) => (
                                    <td
                                        key={cellIdx}
                                        className={`px-4 sm:px-6 py-4 text-sm align-top ${cellIdx === 0 ? 'w-[140px] sm:w-[180px]' : ''}`}
                                    >
                                        {cell.code ? (
                                            <code className="inline-block bg-secondary px-2 py-1 rounded text-xs sm:text-sm text-foreground font-mono whitespace-nowrap">
                                                {cell.code}
                                            </code>
                                        ) : cell.label ? (
                                            <code className="inline-block bg-secondary px-2 py-1 rounded text-xs sm:text-sm text-foreground font-mono whitespace-nowrap">
                                                {cell.label}
                                            </code>
                                        ) : (
                                            <span className="text-muted-foreground">{cell.value}</span>
                                        )}
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
