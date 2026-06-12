import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { CartProvider } from '@/src/contexts/CartContext';
import { DatabaseStatusProvider } from '@/src/contexts/DatabaseStatusContext';
import { Toaster } from 'sonner';

// Pages
import Index from '@/src/pages/Index';
import AdminInit from '@/src/pages/AdminInit';
import CategoryPage from '@/src/pages/CategoryPage';
import ProductPage from '@/src/pages/ProductPage';
import CartPage from '@/src/pages/CartPage';
import CheckoutPage from '@/src/pages/CheckoutPage';
import CheckoutSuccess from '@/src/pages/CheckoutSuccess';
import MyAccount from '@/src/pages/MyAccount';
import MyOrders from '@/src/pages/MyOrders';
import Login from '@/src/pages/Login';
import Register from '@/src/pages/Register';
import ForgotPassword from '@/src/pages/ForgotPassword';
import ResetPassword from '@/src/pages/ResetPassword';
import NotFound from '@/src/pages/NotFound';

// Admin Pages
import AdminDashboard from '@/src/pages/admin/Dashboard';
import AdminProducts from '@/src/pages/admin/Products';
import AdminCategories from '@/src/pages/admin/Categories';
import AdminOrders from '@/src/pages/admin/Orders';
import AdminCustomers from '@/src/pages/admin/Customers';
import AdminCoupons from '@/src/pages/admin/Coupons';
import AdminBanners from '@/src/pages/admin/Banners';
import AdminReports from '@/src/pages/admin/Reports';
import AdminSettings from '@/src/pages/admin/Settings';

// Layouts
import AdminLayout from '@/src/layouts/AdminLayout';

// Components
import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';
import WhatsAppButton from '@/src/components/WhatsAppButton';
import ProtectedRoute from '@/src/components/ProtectedRoute';

const queryClient = new QueryClient();

function StoreLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DatabaseStatusProvider>
          <CartProvider>
            <Router>
              <Routes>
                {/* Store Routes */}
                <Route element={<StoreLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/initialize-admin" element={<AdminInit />} />
                  <Route path="/categoria/:id" element={<CategoryPage />} />
                  <Route path="/produto/:id" element={<ProductPage />} />
                  <Route path="/carrinho" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/checkout/success" element={<CheckoutSuccess />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  <Route element={<ProtectedRoute />}>
                    <Route path="/conta" element={<MyAccount />} />
                    <Route path="/meus-pedidos" element={<MyOrders />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute adminOnly />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/produtos" element={<AdminProducts />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/categorias" element={<AdminCategories />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                    <Route path="/admin/pedidos" element={<AdminOrders />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/customers" element={<AdminCustomers />} />
                    <Route path="/admin/clientes" element={<AdminCustomers />} />
                    <Route path="/admin/coupons" element={<AdminCoupons />} />
                    <Route path="/admin/cupons" element={<AdminCoupons />} />
                    <Route path="/admin/banners" element={<AdminBanners />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/relatorios" element={<AdminReports />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/configuracoes" element={<AdminSettings />} />
                  </Route>
                </Route>
              </Routes>
              <Toaster position="top-right" richColors />
            </Router>
          </CartProvider>
        </DatabaseStatusProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
