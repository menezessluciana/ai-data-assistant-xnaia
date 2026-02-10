import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Table2,
  AlertCircle,
  CheckCircle,
  LogOut,
  User
} from 'lucide-react';
import { TableInfo, QueryResult } from '@ai-data-assistant/shared';
import { XnaiaIcon } from './XnaiaLogo';
import { useAuth } from '../contexts/AuthContext';

// Utility function for generating IDs
const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
import { dataApi } from '../services/api';
import { useApiState } from '../hooks/useApi';
import DataTable from './DataTable';
import ChatInterface from './ChatInterface';
import toast from 'react-hot-toast';

interface DashboardProps {
  className?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  
  // State
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [sessionId] = useState(generateId());
  const [tableData, setTableData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  // API state
  const { data: tables, loading: tablesLoading, executeAsync: loadTables } = useApiState<TableInfo[]>([]);
  const { loading: dataLoading, executeAsync: loadTableData } = useApiState<QueryResult>();

  // Load tables on mount
  useEffect(() => {
    loadTables(
      () => dataApi.getTables(),
      {
        onSuccess: (tables) => {
          if (tables.length > 0 && !selectedTable) {
            setSelectedTable(tables[0].name);
          }
        }
      }
    );
  }, []);

  // Load table data when table changes
  useEffect(() => {
    if (selectedTable) {
      handleLoadTableData();
    }
  }, [selectedTable, currentPage, pageSize, searchQuery]);

  const handleLoadTableData = async () => {
    if (!selectedTable) return;

    try {
      const result = await loadTableData(
        () => dataApi.executeQuery({
          tableName: selectedTable,
          page: currentPage,
          pageSize,
          searchQuery: searchQuery || undefined
        })
      );

      if (result) {
        setTableData(result.data);
        setTotalCount(result.count);
      }
    } catch (error) {
      console.error('Error loading table data:', error);
    }
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    setSearchQuery('');
    setColumnVisibility({});
  };

  const handlePaginationChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleColumnToggle = (column: string, visible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: visible
    }));
  };

  const handleQueryResult = (result: QueryResult & { confidence?: number }) => {
    // Update table data with chat query results
    if (result.data && result.data.length > 0) {
      setTableData(result.data);
      setTotalCount(result.count);
      setCurrentPage(1);

      toast.success(
        `Consulta executada com sucesso! ${result.count} resultado(s) encontrado(s)`,
        { duration: 3000 }
      );
    }
  };

  const handleRefresh = () => {
    if (selectedTable) {
      handleLoadTableData();
      toast.success('Dados atualizados!');
    }
  };

  const handleExport = () => {
    // Simple CSV export
    if (tableData.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const headers = Object.keys(tableData[0]);
    const csvContent = [
      headers.join(','),
      ...tableData.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Dados exportados com sucesso!');
  };

  if (tablesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="text-center">
          <XnaiaIcon size={64} className="mx-auto mb-4 animate-pulse" />
          <div className="loading-dots justify-center mb-4">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-slate-600">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20 ${className}`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-40">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <XnaiaIcon size={40} />
                <div>
                  <h1 className="text-xl font-bold text-gradient">Xnaia</h1>
                  <p className="text-xs text-slate-500">
                    Data Assistant
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="hidden sm:flex items-center space-x-2 text-sm bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-medium">Conectado</span>
              </div>

              {/* Table Selector */}
              {tables && tables.length > 0 && (
                <select
                  value={selectedTable}
                  onChange={(e) => handleTableChange(e.target.value)}
                  className="input min-w-48 bg-white"
                >
                  <option value="">Selecione uma tabela</option>
                  {tables.map((table) => (
                    <option key={table.name} value={table.name}>
                      📊 {table.name} ({table.columns.length} colunas)
                    </option>
                  ))}
                </select>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={!selectedTable || dataLoading}
                className="btn-outline px-3 py-2 disabled:opacity-50 hover:border-purple-400 hover:text-purple-600"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-500 via-purple-500 to-orange-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-slate-700">{user?.name || user?.email?.split('@')[0]}</p>
                    <p className="text-xs text-slate-500">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="btn-ghost px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {!tables || tables.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Nenhuma tabela encontrada
            </h2>
            <p className="text-slate-600 max-w-md mx-auto">
              Não foi possível encontrar tabelas no banco de dados.
              Verifique sua conexão e configuração do Supabase.
            </p>
          </div>
        ) : !selectedTable ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Table2 className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Selecione uma tabela
            </h2>
            <p className="text-slate-600">
              Escolha uma tabela no menu superior para começar a explorar os dados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Data Table - 2/3 width */}
            <div className="lg:col-span-2">
              <DataTable
                data={tableData}
                loading={dataLoading}
                pagination={{
                  current: currentPage,
                  pageSize,
                  total: totalCount,
                  onChange: handlePaginationChange
                }}
                onSearch={handleSearch}
                searchQuery={searchQuery}
                onColumnToggle={handleColumnToggle}
                columnVisibility={columnVisibility}
                onExport={handleExport}
                className="h-full"
              />
            </div>

            {/* Chat Interface - 1/3 width */}
            <div className="lg:col-span-1">
              <ChatInterface
                sessionId={sessionId}
                onQueryResult={handleQueryResult}
                currentTable={selectedTable}
                availableTables={tables?.map(t => t.name) || []}
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-slate-200/50 py-4 px-6">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <XnaiaIcon size={20} />
            <span>Xnaia Data Assistant v1.0.0</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline">Tabelas: {tables?.length || 0}</span>
            <span>Registros: {totalCount.toLocaleString()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
