import React from 'react';
import { cn } from '@/lib/utils';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-dark-border', className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<TableProps> = ({ children, className }) => {
  return (
    <thead className={cn('bg-dark-surface', className)}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<TableProps> = ({ children, className }) => {
  return (
    <tbody className={cn('bg-dark-card divide-y divide-dark-border', className)}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<TableProps> = ({ children, className }) => {
  return (
    <tr className={cn('hover:bg-dark-hover transition-colors', className)}>
      {children}
    </tr>
  );
};

export const TableHead: React.FC<TableProps> = ({ children, className }) => {
  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-light-secondary uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
};

export const TableCell: React.FC<TableProps> = ({ children, className }) => {
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-light-text', className)}>
      {children}
    </td>
  );
};

export default Table;
