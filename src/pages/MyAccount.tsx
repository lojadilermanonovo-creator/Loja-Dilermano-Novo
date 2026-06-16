import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth, db } from '@/src/integrations/firebase/client';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { 
  User, LogOut, Package, MapPin, Settings, CheckCircle2, 
  Plus, Trash2, Edit3, ShieldAlert, Star, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Address {
  id: string;
  name: string;
  receiverName: string;
  receiverPhone: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export default function MyAccount() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile Form States
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [submittingPersonal, setSubmittingPersonal] = useState(false);

  // Address Form States
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressName, setAddressName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const d = await getDoc(doc(db, 'users', user.uid));
      if (d.exists()) {
        const data = d.data();
        setProfile(data);
        setFullName(data.fullName || '');
        setCpf(data.cpf || '');
      } else {
        setProfile({ fullName: '', cpf: '', addresses: [] });
      }
    } catch (e) {
      console.error('Error loading user profile:', e);
      toast.error('Erro ao buscar dados cadastrais');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Format CPF dynamically (999.999.999-99)
  const formatCPF = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 9) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
    } else if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3)}`;
    }
    return formatted;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  // Format CEP dynamically (99999-999)
  const formatCEP = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 8);
    if (raw.length > 5) {
      return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    return raw;
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setZipCode(formatted);

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        if (!response.ok) throw new Error('ViaCEP offline');
        const data = await response.json();
        if (data.erro) {
          toast.warning('CEP não encontrado. Por favor, preencha manualmente.');
        } else {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setStateCode(data.uf || '');
          toast.success('Endereço autocompletado com sucesso!');
        }
      } catch (err) {
        console.warn('ViaCEP API error:', err);
        toast.warning('Não foi possível buscar o CEP automaticamente. Você pode preenchê-lo manualmente.');
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const savePersonalData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!fullName.trim()) {
      toast.error('Informe seu nome completo');
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf && cleanCpf.length !== 11) {
      toast.error('CPF deve conter exatamente 11 dígitos.');
      return;
    }

    setSubmittingPersonal(true);
    try {
      const updatedProfile = {
        ...profile,
        fullName: fullName.trim(),
        cpf: cpf.trim()
      };
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setProfile(updatedProfile);
      setIsEditingPersonal(false);
      toast.success('Dados pessoais salvos com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar dados pessoais: ' + (err.message || ''));
    } finally {
      setSubmittingPersonal(false);
    }
  };

  const handleOpenAddAddress = () => {
    const currentAddresses = profile?.addresses || [];
    if (currentAddresses.length >= 3) {
      toast.error('Limite máximo de 3 endereços atingido.');
      return;
    }
    setEditingAddressId(null);
    setAddressName('');
    setReceiverName(user?.displayName || '');
    setReceiverPhone('');
    setZipCode('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setStateCode('');
    setIsDefault(currentAddresses.length === 0); // Default if first address
    setIsAddressFormOpen(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressName(addr.name);
    setReceiverName(addr.receiverName || '');
    setReceiverPhone(addr.receiverPhone || '');
    setZipCode(addr.zipCode);
    setStreet(addr.street);
    setNumber(addr.number);
    setComplement(addr.complement || '');
    setNeighborhood(addr.neighborhood);
    setCity(addr.city);
    setStateCode(addr.state);
    setIsDefault(addr.isDefault);
    setIsAddressFormOpen(true);
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!addressName.trim() || !zipCode.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !stateCode.trim() || !receiverName.trim() || !receiverPhone.trim()) {
      toast.error('Preencha todos os campos obrigatórios do endereço.');
      return;
    }

    const currentAddresses: Address[] = profile?.addresses || [];

    // Check limit on addition
    if (!editingAddressId && currentAddresses.length >= 3) {
      toast.error('Limite máximo de 3 endereços atingido.');
      return;
    }

    const cleanCep = zipCode.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error('O CEP informado é inválido.');
      return;
    }

    let updatedList = [...currentAddresses];

    const targetDefault = isDefault || currentAddresses.length === 0;

    if (targetDefault) {
      updatedList = updatedList.map(a => ({ ...a, isDefault: false }));
    }

    const newAddressItem: Address = {
      id: editingAddressId || Date.now().toString(),
      name: addressName.trim(),
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      zipCode: zipCode.trim(),
      street: street.trim(),
      number: number.trim(),
      complement: complement.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: stateCode.trim().toUpperCase(),
      isDefault: targetDefault
    };

    if (editingAddressId) {
      updatedList = updatedList.map(a => a.id === editingAddressId ? newAddressItem : a);
    } else {
      updatedList.push(newAddressItem);
    }

    // Double check that at least one address remains default if not empty
    if (updatedList.length > 0 && !updatedList.some(a => a.isDefault)) {
      updatedList[0].isDefault = true;
    }

    try {
      const updatedProfile = {
        ...profile,
        addresses: updatedList
      };
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setProfile(updatedProfile);
      setIsAddressFormOpen(false);
      toast.success(editingAddressId ? 'Endereço atualizado com sucesso!' : 'Endereço cadastrado com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar endereço: ' + (err.message || ''));
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;
    const currentAddresses: Address[] = profile?.addresses || [];
    const updatedList = currentAddresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));

    try {
      const updatedProfile = {
        ...profile,
        addresses: updatedList
      };
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setProfile(updatedProfile);
      toast.success('Endereço preferencial atualizado.');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao atualizar endereço padrão');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    const currentAddresses: Address[] = profile?.addresses || [];
    const target = currentAddresses.find(a => a.id === id);
    if (!target) return;

    let updatedList = currentAddresses.filter(a => a.id !== id);

    // Promote new default if the deleted one was default
    if (target.isDefault && updatedList.length > 0) {
      updatedList[0].isDefault = true;
    }

    try {
      const updatedProfile = {
        ...profile,
        addresses: updatedList
      };
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setProfile(updatedProfile);
      toast.success('Endereço removido com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao excluir endereço: ' + (err.message || ''));
    }
  };

  const savedAddresses: Address[] = profile?.addresses || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Minha Conta</h2>
          <Link to="/conta">
            <Button variant="default" className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 shadow-lg shadow-blue-500/10">
              <User className="h-5 w-5" /> Perfil
            </Button>
          </Link>
          <Link to="/meus-pedidos">
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl h-12 hover:bg-blue-50 hover:text-blue-600 transition-all">
              <Package className="h-5 w-5" /> Meus Pedidos
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl h-12 text-red-600 hover:bg-red-50/80 transition-all font-medium mt-4" onClick={handleLogout}>
            <LogOut className="h-5 w-5" /> Sair da Conta
          </Button>
        </aside>

        {/* Dashboard Main View */}
        <main className="flex-1 space-y-8">
          {loadingProfile ? (
            <div className="bg-white p-12 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Carregando seus dados cadastrais...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Header profile greeting card */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-between">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-blue-500/20">
                    {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{profile?.fullName || user?.displayName || 'Usuário'}</h3>
                    <p className="text-sm text-slate-400 font-mono">{user?.email}</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">Conta Protegida</span>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information Module */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Dados Pessoais
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 font-medium">Mantenha seus dados completos para agilizar o envio dos seus pedidos.</p>

                    {!isEditingPersonal ? (
                      <div className="space-y-4 pb-6">
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/40">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Nome Completo</p>
                          <p className="font-semibold text-slate-800">{profile?.fullName || 'Não informado'}</p>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/40">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">CPF</p>
                          <p className="font-semibold text-slate-800 font-mono">{profile?.cpf || 'Não informado'}</p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={savePersonalData} className="space-y-4 pb-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-xs font-bold text-slate-600">Nome Completo *</Label>
                          <Input 
                            id="fullName" 
                            required 
                            placeholder="Seu nome completo" 
                            value={fullName} 
                            onChange={e => setFullName(e.target.value)} 
                            className="rounded-xl border-slate-200 h-10 text-sm focus-visible:ring-blue-500" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cpf" className="text-xs font-bold text-slate-600">CPF (apenas números)</Label>
                          <Input 
                            id="cpf" 
                            placeholder="000.000.000-00" 
                            value={cpf} 
                            onChange={handleCpfChange} 
                            className="rounded-xl border-slate-200 h-10 text-sm font-mono focus-visible:ring-blue-500" 
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <Button 
                            type="submit" 
                            disabled={submittingPersonal} 
                            className="bg-blue-600 text-white font-bold hover:bg-blue-700 h-10 px-5 rounded-xl cursor-pointer"
                          >
                            {submittingPersonal ? 'Salvando...' : 'Salvar Alterações'}
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsEditingPersonal(false)} 
                            className="text-slate-500 hover:bg-slate-100 h-10 rounded-xl"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>

                  {!isEditingPersonal && (
                    <Button 
                      type="button" 
                      onClick={() => {
                        setFullName(profile?.fullName || '');
                        setCpf(profile?.cpf || '');
                        setIsEditingPersonal(true);
                      }} 
                      variant="outline" 
                      className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-bold h-11 rounded-xl flex items-center justify-center gap-2 cursor-pointer w-full mt-auto"
                    >
                      <Edit3 className="h-4 w-4" />
                      Editar Dados Cadastrais
                    </Button>
                  )}
                </div>

                {/* Addresses Management Module */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Endereços de Entrega
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">Adicione até 3 endereços para envios rápidos.</p>
                    </div>
                    {savedAddresses.length < 3 && !isAddressFormOpen && (
                      <Button 
                        type="button" 
                        onClick={handleOpenAddAddress}
                        size="sm"
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100/80 font-bold rounded-xl h-9 px-3 flex items-center gap-1.5 cursor-pointer border border-blue-100"
                      >
                        <Plus className="h-4 w-4" /> Cadastrar
                      </Button>
                    )}
                  </div>

                  {/* Addresses List view */}
                  {!isAddressFormOpen && (
                    <div className="space-y-4">
                      {savedAddresses.length === 0 ? (
                        <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 text-center space-y-3">
                          <MapPin className="h-8 w-8 text-slate-300 mx-auto" />
                          <div>
                            <p className="text-sm font-bold text-slate-700">Nenhum endereço cadastrado</p>
                            <p className="text-xs text-slate-400 mt-1">Configure seus locais de entrega preferidos para usar no checkout.</p>
                          </div>
                          <Button 
                            type="button" 
                            onClick={handleOpenAddAddress} 
                            variant="outline" 
                            className="bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50 rounded-xl h-10 px-4 mt-2"
                          >
                            Adicionar Primeiro Endereço
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {savedAddresses.map((addr) => (
                            <div 
                              key={addr.id} 
                              className={`p-4 rounded-2xl border transition-all ${
                                addr.isDefault 
                                  ? 'bg-blue-50/40 border-blue-200/80 shadow-sm' 
                                  : 'bg-white border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800 text-sm">{addr.name}</span>
                                    {addr.isDefault && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 uppercase tracking-widest">
                                        <Star className="h-2.5 w-2.5 fill-blue-700" /> Principal
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-600 text-xs mt-1.5 leading-relaxed font-semibold">
                                    {addr.street}, Nº {addr.number} {addr.complement ? ` - ${addr.complement}` : ''}
                                  </p>
                                  <p className="text-slate-500 text-[11px] font-medium">
                                    {addr.neighborhood} | {addr.city} - {addr.state}
                                  </p>
                                  <p className="text-slate-400 text-[10px] font-mono mt-1">
                                    CEP: {addr.zipCode}
                                  </p>
                                  
                                  {/* Receiver fields display */}
                                  {(addr.receiverName || addr.receiverPhone) && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-100/60 text-[11px] text-slate-500">
                                      <span className="font-bold text-slate-600">Destinatário:</span> {addr.receiverName || 'Não definido'} 
                                      {addr.receiverPhone && <span className="text-slate-400 font-mono ml-1.5">({addr.receiverPhone})</span>}
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      type="button" 
                                      size="icon" 
                                      variant="ghost" 
                                      onClick={() => handleOpenEditAddress(addr)}
                                      className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                      title="Editar"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                      type="button" 
                                      size="icon" 
                                      variant="ghost" 
                                      onClick={() => handleDeleteAddress(addr.id)}
                                      className="h-8 w-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                  {!addr.isDefault && (
                                    <Button 
                                      type="button" 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => handleSetDefaultAddress(addr.id)}
                                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-lg h-7 px-2 cursor-pointer"
                                    >
                                      Usar como Principal
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {savedAddresses.length >= 3 && (
                            <p className="text-[11px] text-slate-400 font-medium text-center bg-slate-50/50 py-2 border border-slate-100 rounded-xl">
                              Você atingiu o limite de 3 endereços cadastrados.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Address block */}
                  {isAddressFormOpen && (
                    <form onSubmit={saveAddress} className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200/50 pb-2 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        {editingAddressId ? 'Editar Endereço' : 'Novo Endereço de Entrega'}
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="addrName" className="text-[11px] font-bold text-slate-600">Identificação do Endereço *</Label>
                          <Input 
                            id="addrName" 
                            required 
                            placeholder="Ex: Minha Casa, Escritório, Avós" 
                            value={addressName} 
                            onChange={e => setAddressName(e.target.value)} 
                            className="bg-white rounded-xl border-slate-200 h-9 text-sm" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="receiverName" className="text-[11px] font-bold text-slate-600">Destinatário *</Label>
                          <Input 
                            id="receiverName" 
                            required 
                            placeholder="Nome de quem recebe" 
                            value={receiverName} 
                            onChange={e => setReceiverName(e.target.value)} 
                            className="bg-white rounded-xl border-slate-200 h-9 text-sm" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="receiverPhone" className="text-[11px] font-bold text-slate-600">Telefone *</Label>
                          <Input 
                            id="receiverPhone" 
                            required 
                            placeholder="Ex: (11) 99999-9999" 
                            value={receiverPhone} 
                            onChange={e => setReceiverPhone(e.target.value)} 
                            className="bg-white rounded-xl border-slate-200 h-9 text-sm font-mono" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="zipCode" className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            CEP *
                            {loadingCep && <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />}
                          </Label>
                          <Input 
                            id="zipCode" 
                            required 
                            placeholder="00000-000" 
                            value={zipCode} 
                            onChange={handleCepChange} 
                            className="bg-white rounded-xl border-slate-200 h-9 text-sm font-mono" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="number" className="text-[11px] font-bold text-slate-600">Número *</Label>
                          <Input 
                            id="number" 
                            required 
                            placeholder="Ex: 123, S/N" 
                            value={number} 
                            onChange={e => setNumber(e.target.value)} 
                            className="bg-white rounded-xl border-slate-200 h-9 text-sm" 
                          />
                        </div>

                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="street" className="text-[11px] font-bold text-slate-600">Rua *</Label>
                          <Input 
                            id="street" 
                            required 
                            placeholder="Logradouro" 
                            value={street} 
                            onChange={e => setStreet(e.target.value)} 
                            className="bg-white rounded-xl border-slate-200 h-9 text-sm" 
                          />
                        </div>

                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="complement" className="text-[11px] font-bold text-slate-600">Complemento (opcional)</Label>
                          <Input 
                            id="complement" 
                            placeholder="Ex: Apto 42, Bloco B" 
                            value={complement} 
                            onChange={e => setComplement(e.target.value)} 
                            className="bg-white rounded-xl border-slate-200 h-9 text-sm" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="neighborhood" className="text-[11px] font-bold text-slate-600">Bairro *</Label>
                          <Input 
                            id="neighborhood" 
                            required 
                            placeholder="Bairro" 
                            value={neighborhood} 
                            onChange={e => setNeighborhood(e.target.value)} 
                            className="bg-white rounded-xl border-slate-200 h-9 text-sm" 
                          />
                        </div>

                        <div className="grid grid-cols-3 col-span-1 gap-2">
                          <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="city" className="text-[11px] font-bold text-slate-600">Cidade *</Label>
                            <Input 
                              id="city" 
                              required 
                              placeholder="Cidade" 
                              value={city} 
                              onChange={e => setCity(e.target.value)} 
                              className="bg-white rounded-xl border-slate-200 h-9 text-xs" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="stateCode" className="text-[11px] font-bold text-slate-600">UF *</Label>
                            <Input 
                              id="stateCode" 
                              required 
                              placeholder="UF" 
                              maxLength={2} 
                              value={stateCode} 
                              onChange={e => setStateCode(e.target.value)} 
                              className="bg-white rounded-xl border-slate-200 h-9 text-xs uppercase text-center font-bold" 
                            />
                          </div>
                        </div>
                      </div>

                      {savedAddresses.length > 0 && (
                        <div className="flex items-center gap-2 pt-2">
                          <input 
                            type="checkbox" 
                            id="isDefaultOpt" 
                            checked={isDefault}
                            onChange={e => setIsDefault(e.target.checked)}
                            className="rounded text-blue-600 border-slate-300 focus:ring-blue-500" 
                          />
                          <Label htmlFor="isDefaultOpt" className="text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                            Definir este endereço como principal
                          </Label>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-3 border-t border-slate-200/50">
                        <Button 
                          type="submit" 
                          className="bg-blue-600 text-white font-bold hover:bg-blue-700 h-9 px-4 rounded-xl cursor-pointer text-xs"
                        >
                          Salvar Endereço
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setIsAddressFormOpen(false)} 
                          className="text-slate-500 hover:bg-slate-100 h-9 rounded-xl text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
