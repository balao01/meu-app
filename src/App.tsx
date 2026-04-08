import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  DollarSign, 
  LayoutGrid, 
  Download, 
  Printer,
  FileText,
  LogOut,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';

// Tipos, Hooks e Serviços
import { Order, OrderStatus, ADMIN_EMAIL } from './types';
import { useOrders } from './hooks/useOrders';
import { StorageService } from './lib/storage';

// Componentes de Interface
import { AuthScreen } from './components/AuthScreen';
import { OrderModal } from './components/OrderModal';
import { 
  OrdersTab, 
  WeekTab, 
  FinancialTab, 
  ProductionTab, 
  AgendaTab, 
  AdminTab 
} from './components/Tabs';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'semana' | 'financeiro' | 'producao' | 'agenda' | 'admin'>('pedidos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'Todos' | 'Atrasados'>('Todos');
  
  // Estado de Autenticação
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Inicializa a sessão ao carregar o app
  useEffect(() => {
    const isAdminSession = StorageService.getSession();
    if (isAdminSession) {
      setUserEmail(ADMIN_EMAIL);
    }
    setAuthLoading(false);
  }, []);

  // Hook Customizado para gerenciar a lógica de pedidos
  const { 
    orders, 
    addOrder, 
    updateOrder, 
    deleteOrder, 
    toggleStatus, 
    updateChecklist, 
    resetChecklist 
  } = useOrders(userEmail || undefined);

  const isAdmin = userEmail === ADMIN_EMAIL;

  const handleLogout = () => {
    StorageService.clearSession();
    setUserEmail(null);
    setActiveTab('pedidos');
  };

  const handleLogin = (email: string) => {
    setUserEmail(email);
  };

  // Lógica de Exportação para CSV (Excel)
  const exportCSV = () => {
    const headers = ["Nome", "Telefone", "Tipo de Bolo", "Sabor", "Tamanho", "Data Pedido", "Data Entrega", "Valor Total", "Valor Recebido", "Restante", "Status", "Observações"];
    const rows = orders.map(o => [
      o.clientName,
      o.phone,
      o.cakeType,
      o.flavor,
      o.size,
      o.orderDate,
      o.deliveryDate,
      o.totalValue,
      o.receivedValue,
      o.totalValue - o.receivedValue,
      o.status,
      o.observations.replace(/\n/g, " ")
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `boleira-organizada-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // Lógica de Impressão / PDF
  const exportPDF = () => {
    window.print();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-offwhite">
        <Loader2 className="animate-spin text-pink-500" size={48} />
      </div>
    );
  }

  // Se não estiver logado, mostra a tela de autenticação
  if (!userEmail) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Cabeçalho Fixo */}
      <header className="bg-white border-b border-pink-100 p-4 sticky top-0 z-10 flex justify-between items-center no-print">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-pink-600 flex items-center gap-2">
            🎂 Boleira Organizada
          </h1>
          <span className="text-[10px] text-gray-400">{userEmail}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-pink-100 text-pink-600 rounded-full active:scale-90 transition-transform"
          >
            <Plus size={24} />
          </button>
          <div className="relative group">
            <button className="p-2 bg-pink-100 text-pink-600 rounded-full">
              <Download size={24} />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-pink-50 hidden group-hover:block overflow-hidden z-30">
              <button onClick={exportCSV} className="w-full text-left px-4 py-3 hover:bg-pink-50 flex items-center gap-2">
                <FileText size={18} /> CSV (Excel)
              </button>
              <button onClick={exportPDF} className="w-full text-left px-4 py-3 hover:bg-pink-50 flex items-center gap-2">
                <Printer size={18} /> PDF / Imprimir
              </button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-500 flex items-center gap-2 border-t border-gray-100">
                <LogOut size={18} /> Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal (Abas) */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'pedidos' && (
            <OrdersTab 
              orders={orders} 
              filter={filter} 
              setFilter={setFilter} 
              onEdit={(o: Order) => { setEditingOrder(o); setIsModalOpen(true); }}
              onDelete={deleteOrder}
              onToggleStatus={toggleStatus}
            />
          )}
          {activeTab === 'semana' && <WeekTab orders={orders} />}
          {activeTab === 'financeiro' && <FinancialTab orders={orders} />}
          {activeTab === 'producao' && (
            <ProductionTab 
              orders={orders} 
              onUpdateChecklist={updateChecklist} 
              onResetChecklist={resetChecklist}
            />
          )}
          {activeTab === 'agenda' && <AgendaTab orders={orders} />}
          {activeTab === 'admin' && isAdmin && <AdminTab />}
        </AnimatePresence>
      </main>

      {/* Navegação Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 flex justify-around items-center h-20 px-2 no-print z-20">
        <TabButton active={activeTab === 'pedidos'} onClick={() => setActiveTab('pedidos')} icon={<LayoutGrid />} label="Pedidos" />
        <TabButton active={activeTab === 'semana'} onClick={() => setActiveTab('semana')} icon={<Calendar />} label="Semana" />
        <TabButton active={activeTab === 'financeiro'} onClick={() => setActiveTab('financeiro')} icon={<DollarSign />} label="Financeiro" />
        <TabButton active={activeTab === 'producao'} onClick={() => setActiveTab('producao')} icon={<CheckCircle2 />} label="Produção" />
        <TabButton active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} icon={<Calendar />} label="Agenda" />
        {isAdmin && <TabButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<ShieldCheck />} label="Admin" />}
      </nav>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <OrderModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingOrder(null); }} 
          onSave={(order: Order) => {
            if (editingOrder) updateOrder(order);
            else addOrder(order);
            setIsModalOpen(false);
            setEditingOrder(null);
          }}
          editingOrder={editingOrder}
        />
      )}
    </div>
  );
}

// Componente Auxiliar para os Botões da Nav
function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`tab-button ${active ? 'active' : 'text-gray-400'}`}>
      <span className="mb-1">{icon}</span>
      <span className="text-[10px]">{label}</span>
    </button>
  );
}
