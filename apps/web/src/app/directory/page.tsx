'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@workhub/ui';

interface EmployeeItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  department?: { id: string; name: string; code: string };
  designation?: { id: string; title: string; level: number };
  primaryManager?: { id: string; firstName: string; lastName: string; email: string };
  roles: string[];
}

export default function DirectoryPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('workhub_token') : null;
      const url = `/api/v1/employees${query ? `?search=${encodeURIComponent(query)}` : ''}`;
      const res = await fetch(url, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees(data.data);
      } else {
        // Fallback demo indicator when unauthenticated / server initial
        setEmployees([]);
      }
    } catch (err: any) {
      setError('Unable to load employees. Ensure NestJS API is running on port 4000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees(search);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#F1E9E0]">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Employee Directory</h1>
          <p className="text-sm text-[#64748B] mt-1">
            People, designations, departments, and reporting managers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm">+ New Employee</Button>
        </div>
      </div>

      <div className="my-6 flex gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or employee code..."
            className="flex-1 px-3 py-2 text-sm bg-white border border-[#F1E9E0] rounded-md focus:outline-none focus:border-[#FF8A00]"
          />
          <Button type="submit" variant="secondary" size="md">Search</Button>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#FFF3E8] border border-[#FFE4CC] rounded-lg text-sm text-[#B45309]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[#64748B] text-sm">
          Loading employee directory...
        </div>
      ) : employees.length === 0 ? (
        <Card padding={8}>
          <div className="text-center py-8">
            <h3 className="text-base font-semibold text-[#1F2937]">No Employees Found</h3>
            <p className="text-sm text-[#64748B] mt-1 max-w-sm mx-auto">
              No employee records matched your query. Sign in as Admin or invite team members to populate the directory.
            </p>
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-[#F1E9E0] overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FFFAF5] border-b border-[#F1E9E0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Designation</th>
                <th className="px-6 py-3">Primary Manager</th>
                <th className="px-6 py-3">Roles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E9E0]">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#FFFAF5]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#1F2937]">{emp.firstName} {emp.lastName}</div>
                    <div className="text-xs text-[#64748B]">{emp.email}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#1F2937]">
                    {emp.employeeCode}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-[#1F2937] bg-[#FFF3E8] text-[#FF8A00] px-2 py-0.5 rounded">
                      {emp.department?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#1F2937]">
                    {emp.designation?.title || '—'}
                  </td>
                  <td className="px-6 py-4 text-[#64748B]">
                    {emp.primaryManager ? (
                      <span className="font-medium text-[#1F2937]">
                        {emp.primaryManager.firstName} {emp.primaryManager.lastName}
                      </span>
                    ) : (
                      <span className="italic text-xs text-[#94A3B8]">Direct (Executive)</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {emp.roles.length > 0 ? (
                        emp.roles.map((r) => (
                          <Badge key={r} status={r === 'SYSTEM_ADMIN' ? 'danger' : 'info'}>
                            {r}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-[#94A3B8]">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
