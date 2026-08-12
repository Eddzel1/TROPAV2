import { useState } from 'react';
import { useActivityLogs } from '../../hooks/useSupabase';
import { Menu, Activity } from 'lucide-react';

interface LogsProps {
  onMenuClick: () => void;
}

export function Logs({ onMenuClick }: LogsProps) {
  const { logs, loading } = useActivityLogs();
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-6 w-6 text-teal-600" />
                Activity Logs
              </h1>
              <p className="text-sm text-gray-500">Track user actions across the system</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Action:</label>
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          >
            <option value="ALL">All Actions</option>
            <option value="ADD">Additions</option>
            <option value="EDIT">Edits</option>
            <option value="DELETE">Deletions</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No activity logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.user_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${log.action === 'ADD' ? 'bg-green-100 text-green-800' : 
                            log.action === 'EDIT' ? 'bg-blue-100 text-blue-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.entity_type} {log.entity_id && <span className="text-xs text-gray-400">({log.entity_id.substring(0, 8)}...)</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={JSON.stringify(log.details)}>
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
