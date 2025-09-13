import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logService } from '../services/api';
import { 
  LogOut, 
  Search, 
  RefreshCw, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileText,
  Users,
  Zap
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLogType, setSelectedLogType] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConditions, setDeleteConditions] = useState({
    startDate: '',
    endDate: '',
    search: ''
  });
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  const logTypes = [
    { key: 'general', label: 'General Logs', icon: FileText },
    { key: 'login', label: 'Login Logs', icon: Users },
    { key: 'tokens', label: 'Token Usage', icon: Zap },
    { key: 'app', label: 'Application Logs', icon: BarChart3 }
  ];

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [selectedLogType, currentPage, searchTerm, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const result = await logService.getLogs(
        selectedLogType,
        currentPage,
        50,
        searchTerm,
        dateFilter.startDate,
        dateFilter.endDate
      );
      setLogs(result.logs);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const result = await logService.getLogStats();
      setStats(result);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleDeleteLogs = async () => {
    try {
      const result = await logService.deleteLogs(selectedLogType, deleteConditions);
      alert(`Deleted ${result.deletedCount} log entries`);
      setShowDeleteModal(false);
      setDeleteConditions({ startDate: '', endDate: '', search: '' });
      fetchLogs();
      fetchStats();
    } catch (error) {
      alert(`Error deleting logs: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatLogData = (logEntry) => {
    const { time, level, msg, message, ...rest } = logEntry;
    return {
      timestamp: time,
      level: level || 'info',
      message: msg || message || 'No message',
      data: rest
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Log Insight Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.username}</p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {logTypes.map((type) => {
            const Icon = type.icon;
            const stat = stats[type.key] || { count: 0, size: 0 };
            return (
              <div key={type.key} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {type.label}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stat.count.toLocaleString()} entries
                        </dd>
                        <dd className="text-xs text-gray-500">
                          {(stat.size / 1024).toFixed(1)} KB
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Log Type Selector */}
              <div className="flex space-x-2">
                {logTypes.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => {
                      setSelectedLogType(type.key);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      selectedLogType === type.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchLogs}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Logs
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              </div>
              <div>
                <input
                  type="date"
                  placeholder="Start Date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="date"
                  placeholder="End Date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {logTypes.find(t => t.key === selectedLogType)?.label} 
              {loading && <span className="ml-2 text-sm text-gray-500">(Loading...)</span>}
            </h3>
          </div>
          
          {logs.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {logs.map((log, index) => {
                const formatted = formatLogData(log);
                return (
                  <li key={index} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            formatted.level === 'error' ? 'bg-red-100 text-red-800' :
                            formatted.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                            formatted.level === 'info' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {formatted.level}
                          </span>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formatted.message}
                          </p>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            {formatDate(formatted.timestamp)}
                          </p>
                          {Object.keys(formatted.data).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-blue-600 cursor-pointer">
                                Show details
                              </summary>
                              <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(formatted.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">
                {loading ? 'Loading logs...' : 'No logs found'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mt-4">
                Delete Logs
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Search Term (optional)
                  </label>
                  <input
                    type="text"
                    value={deleteConditions.search}
                    onChange={(e) => setDeleteConditions({ ...deleteConditions, search: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    placeholder="Delete logs containing..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date (optional)
                  </label>
                  <input
                    type="date"
                    value={deleteConditions.startDate}
                    onChange={(e) => setDeleteConditions({ ...deleteConditions, startDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={deleteConditions.endDate}
                    onChange={(e) => setDeleteConditions({ ...deleteConditions, endDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-6 space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLogs}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
