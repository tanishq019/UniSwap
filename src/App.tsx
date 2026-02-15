import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Search,
  Plus,
  CheckCircle2,
  UserCircle2,
  Settings,
  LogOut,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { supabase, Product } from './lib/supabase';
import ProductDetailModal from './components/ProductDetailModal';
import SellItemModal from './components/SellItemModal';
import EditItemModal from './components/EditItemModal';

const categories = [
  'All',
  'Books',
  'Electronics',
  'Lab Gear',
  'Cycles',
  'Engineering Drawing',
  'Miscellaneous',
];

type ThemeMode = 'day' | 'night';
type AppView = 'marketplace' | 'profile' | 'settings';

const BANNER_PALETTES = [
  ['#2b2f77', '#4f46e5'],
  ['#1d4d7a', '#0ea5e9'],
  ['#3d2c8d', '#8b5cf6'],
  ['#2f4858', '#0f766e'],
  ['#4f2b5f', '#db2777'],
  ['#3d3f44', '#6b7280'],
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('uniswap-theme');
    return stored === 'day' ? 'day' : 'night';
  });
  const [activeView, setActiveView] = useState<AppView>('marketplace');

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, true>>({});
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('uniswap-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setAuthLoading(false);
    };
    initAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const goHome = () => {
    setActiveView('marketplace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterProducts = useCallback(() => {
    let filtered = products;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      const normalized = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(normalized) ||
          p.description.toLowerCase().includes(normalized) ||
          p.category.toLowerCase().includes(normalized)
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [products, searchQuery]);

  const shouldShowSearchDropdown = isSearchFocused && searchQuery.trim().length > 0;

  const handleAuth = async () => {
    if (!authEmail || !authPassword) return;
    setAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        alert('Account created. Verify email first if confirmation is enabled.');
        setAuthMode('login');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) fetchProducts();
  }, [session, fetchProducts]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('realtime:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchProducts]);

  const openWhatsApp = (product: Product) => {
    const message = encodeURIComponent(
      `Hi! I'm interested in your ${product.title} listed on UniSwap for \u20B9${product.price}`
    );
    window.open(
      `https://wa.me/${product.seller_phone.replace(/[^0-9]/g, '')}?text=${message}`,
      '_blank'
    );
  };

  const resolveDisplayImage = (product: Product) => (product.image_url || '').trim();

  const hasRealImage = (product: Product) => {
    const image = (product.image_url || '').trim();
    return Boolean(image) && !image.startsWith('data:image/svg') && !brokenImageIds[product.id];
  };

  const getBannerStyle = (product: Product) => {
    const seed = `${product.title}-${product.category}-${product.id}`;
    const paletteIndex = hashString(seed) % BANNER_PALETTES.length;
    const [start, end] = BANNER_PALETTES[paletteIndex];
    return {
      backgroundImage: `linear-gradient(145deg, ${start} 0%, ${end} 100%)`,
    };
  };

  const featuredProducts = useMemo(
    () => (filteredProducts.length > 0 ? filteredProducts : products),
    [filteredProducts, products]
  );

  const featuredRows = useMemo(() => {
    const rows: Product[][] = [];
    for (let i = 0; i < featuredProducts.length; i += 4) {
      rows.push(featuredProducts.slice(i, i + 4));
    }
    return rows;
  }, [featuredProducts]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-main">
        Checking session...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="fixed inset-0 radial-glow pointer-events-none"></div>

        <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[1200px] glass-nav rounded-full px-6 py-3 flex items-center justify-between z-50">
          <button onClick={goHome} className="flex items-center gap-2">
            <div className="size-8 bg-[var(--brand)] rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-lg font-bold tracking-tight text-main">UniSwap</span>
          </button>
          <div className="flex items-center gap-4 md:gap-8">
            <button className="text-sm font-medium text-muted hover:text-main transition-colors">Help</button>
            <button className="text-sm font-medium text-muted hover:text-main transition-colors">About</button>
            <button className="ghost-button text-[var(--brand)] px-4 py-2 rounded-full text-sm font-semibold border-[var(--brand)]/40">
              Student Login
            </button>
          </div>
        </nav>

        <main className="relative z-10 w-full max-w-[440px] px-6 pt-24">
          <div className="auth-panel rounded-xl p-8 md:p-10 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-[var(--brand)]/10 border border-[var(--brand)]/20 mb-4">
                <UserCircle2 className="h-7 w-7 text-[var(--brand)]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-main mb-2">
                {authMode === 'login' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-sm text-muted">
                {authMode === 'login'
                  ? 'Enter your credentials to access your account.'
                  : 'Join UniSwap with your student credentials.'}
              </p>
            </div>

            <div className="space-y-5">
              <div className="relative floating-label-input">
                <input
                  id="email"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder=" "
                  className="block w-full px-4 pt-6 pb-2 input-surface rounded-lg text-main placeholder-transparent focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                />
                <label htmlFor="email" className="absolute left-4 top-4 text-muted text-base transition-all pointer-events-none origin-left">
                  Email Address
                </label>
              </div>

              <div className="relative floating-label-input">
                <input
                  id="password"
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder=" "
                  className="block w-full px-4 pt-6 pb-2 input-surface rounded-lg text-main placeholder-transparent focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                />
                <label htmlFor="password" className="absolute left-4 top-4 text-muted text-base transition-all pointer-events-none origin-left">
                  Password
                </label>
              </div>

              <div className="flex justify-end">
                <button className="text-xs font-medium text-[var(--brand)] hover:opacity-80 transition-colors">
                  Forgot password?
                </button>
              </div>

              <button
                onClick={handleAuth}
                disabled={authSubmitting}
                className="glow-button w-full brand-button text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{authSubmitting ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-[var(--border)]"></div>
              <span className="text-[10px] uppercase tracking-widest text-muted font-bold">Or continue with</span>
              <div className="h-px flex-1 bg-[var(--border)]"></div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 ghost-button py-3 rounded-lg flex items-center justify-center transition-colors">
                <div className="size-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600"></div>
              </button>
              <button className="flex-1 ghost-button py-3 rounded-lg flex items-center justify-center transition-colors">
                <div className="size-5 rounded-full bg-white flex items-center justify-center">
                  <div className="size-3 bg-black rounded-full"></div>
                </div>
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-muted">
              {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-main font-semibold hover:underline underline-offset-4"
              >
                {authMode === 'login' ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-main">
      <div className="fixed inset-0 radial-glow pointer-events-none z-0"></div>

      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-12">
            <button onClick={goHome} className="flex items-center gap-3">
              <div className="size-8 bg-[var(--brand)] rounded flex items-center justify-center text-white font-bold">
                S
              </div>
              <span className="text-xl font-bold tracking-tight text-main">UniSwap</span>
            </button>
            <div className="hidden md:flex items-center gap-8">
              <button onClick={goHome} className="text-sm font-medium text-muted hover:text-main transition-colors">Browse</button>
              <button onClick={() => setShowSellModal(true)} className="text-sm font-medium text-muted hover:text-main transition-colors">Sell</button>
              <button onClick={() => setActiveView('settings')} className="text-sm font-medium text-muted hover:text-main transition-colors">About</button>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="search-container relative w-44 md:w-52 transition-all duration-500 ease-in-out rounded-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 120)}
                className="w-full input-surface rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-[var(--brand)]"
                placeholder="Search campus..."
                type="text"
              />
              {shouldShowSearchDropdown && (
                <div className="absolute top-12 left-0 right-0 surface-soft rounded-xl p-2 shadow-2xl z-[60]">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        onMouseDown={() => {
                          setSelectedProduct(item);
                          setSearchQuery(item.title);
                          setIsSearchFocused(false);
                          setActiveView('marketplace');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--input-bg)]"
                      >
                        <p className="text-sm text-main font-semibold truncate">{item.title}</p>
                        <p className="text-xs text-muted truncate">{item.category}</p>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted">No results found for "{searchQuery}".</div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveView('profile')}
              className="brand-button text-white px-3 md:px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
            >
              <UserCircle2 className="h-4 w-4" />
              <span className="hidden md:inline">Student Login</span>
            </button>

            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="ghost-button p-2 rounded-lg"
              >
                <UserCircle2 className="h-5 w-5" />
              </button>
              <div className={`absolute right-0 top-11 w-52 rounded-xl surface-soft p-2 shadow-2xl ${profileMenuOpen ? 'block' : 'hidden'}`}>
                <button onClick={() => { setActiveView('profile'); setProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-main hover:bg-[var(--input-bg)]">View Profile</button>
                <button onClick={() => { setActiveView('settings'); setProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-main hover:bg-[var(--input-bg)] flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button onClick={() => { setProfileMenuOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>

            <button
              onClick={() => setThemeMode(themeMode === 'night' ? 'day' : 'night')}
              className="ghost-button p-2 rounded-lg"
              title="Toggle Theme"
            >
              {themeMode === 'night' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        {activeView === 'profile' && (
          <section className="surface-card rounded-2xl p-7 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-main">Profile</h2>
            <p className="text-muted mt-2">Your connected account details.</p>
            <div className="mt-5 text-main space-y-2">
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Id:</strong> {session.user.id}</p>
              <p><strong>Last Sign-In:</strong> {session.user.last_sign_in_at || 'N/A'}</p>
            </div>
          </section>
        )}

        {activeView === 'settings' && (
          <section className="surface-card rounded-2xl p-7 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-main">Settings</h2>
            <p className="text-muted mt-2">Experience controls.</p>
            <div className="surface-soft rounded-xl p-4 mt-6">
              <p className="text-main font-semibold mb-3">Theme Mode</p>
              <div className="flex gap-3">
                <button onClick={() => setThemeMode('day')} className={`px-4 py-2 rounded-lg ${themeMode === 'day' ? 'brand-button text-white' : 'ghost-button'}`}>Day</button>
                <button onClick={() => setThemeMode('night')} className={`px-4 py-2 rounded-lg ${themeMode === 'night' ? 'brand-button text-white' : 'ghost-button'}`}>Night</button>
              </div>
            </div>
          </section>
        )}

        {activeView === 'marketplace' && (
          <>
            <section className="text-center mb-20 mt-8">
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-main mb-6">UniSwap</h1>
              <p className="text-lg md:text-xl text-muted font-light max-w-2xl mx-auto leading-relaxed">
                The exclusive marketplace for the campus community.
                <br />
                Trade textbooks, electronics, and dorm essentials with verified students.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <button
                  onClick={() => {
                    const section = document.getElementById('featured');
                    if (section) section.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-opacity-90 transition-all"
                >
                  Start Browsing
                </button>
                <button
                  onClick={() => setShowSellModal(true)}
                  className="ghost-button text-main font-bold px-8 py-4 rounded-xl flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  List an Item
                </button>
              </div>
            </section>

            <div id="featured" className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-main mb-2">Featured Deals</h2>
                <p className="text-muted text-sm">Handpicked items from your local campus hub</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-14 text-muted">Loading featured items...</div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-14 text-muted">No products yet. List your first item.</div>
            ) : (
              <>
                <div className="space-y-4 mb-10">
                  {featuredRows.map((row, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="accordion-row hidden lg:flex gap-4 h-[500px]">
                      {Array.from({ length: 4 }).map((_, index) => {
                        const product = row[index];
                        if (!product) {
                          return (
                            <div
                              key={`empty-${rowIndex}-${index}`}
                              className="accordion-item accordion-card h-[500px] pointer-events-none opacity-0"
                              aria-hidden="true"
                            />
                          );
                        }
                        return (
                          <div
                            key={`${product.id}-${index}`}
                            onClick={() => setSelectedProduct(product)}
                            className="accordion-item accordion-card h-[500px] diamond-edge glass-card group cursor-pointer reveal-item"
                            style={{ animationDelay: `${(rowIndex * 4 + index) * 80 + 70}ms` }}
                          >
                            {hasRealImage(product) ? (
                              <>
                                <div className="fallback-mesh absolute inset-0"></div>
                                <img
                                  src={resolveDisplayImage(product)}
                                  alt={product.title}
                                  className="absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    setBrokenImageIds((prev) => ({ ...prev, [product.id]: true }));
                                  }}
                                />
                              </>
                            ) : (
                              <div className="banner-card absolute inset-0 p-6 flex flex-col" style={getBannerStyle(product)}>
                                <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase backdrop-blur-sm self-start">
                                  {product.category}
                                </span>
                                <div className="flex-1 flex items-center justify-center px-2">
                                  <h3 className="text-white text-3xl font-extrabold tracking-tight leading-tight line-clamp-2 text-center">
                                    {product.title}
                                  </h3>
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                            <div className="glass-overlay"></div>

                            <div className={`card-badges ${hasRealImage(product) ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-300'}`}>
                              <span className="card-category-tag bg-[var(--brand)] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                                {product.category}
                              </span>
                              <span className="bg-white text-black text-sm font-black px-3 py-1 rounded-lg w-fit">
                                {'\u20B9'}{product.price}
                              </span>
                              <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full w-fit tracking-wider uppercase shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                                {product.condition}
                              </span>
                              <div className="flex items-center gap-1 mt-1 text-white/80">
                                <span className="text-[10px] font-medium truncate max-w-[100px]">{product.seller_name}</span>
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                              </div>
                            </div>

                            <div className={`card-teaser absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-100 translate-y-0 group-hover:opacity-0 group-hover:translate-y-2 transition-all duration-300 ${hasRealImage(product) ? '' : 'opacity-0 pointer-events-none'}`}>
                              <h3 className="text-white font-bold text-2xl line-clamp-2 leading-tight mb-2">
                                {product.title}
                              </h3>
                              <p className="text-white/75 text-sm line-clamp-2">{product.description}</p>
                            </div>

                            <div
                              className="card-content-reveal absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                            >
                              <h3 className="text-2xl font-bold text-white truncate mb-2">
                                {product.title}
                              </h3>
                              <p className="text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                                {product.description}
                              </p>
                              <div className="flex items-center justify-between mt-auto gap-3">
                                <p className="text-indigo-300 font-bold text-xl shrink-0">{'\u20B9'}{product.price}</p>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openWhatsApp(product);
                                  }}
                                  className="wa-button px-4 py-2 rounded-lg font-semibold text-sm"
                                >
                                  WhatsApp
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
                    {featuredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className="surface-card rounded-xl overflow-hidden cursor-pointer relative"
                      >
                        {hasRealImage(product) ? (
                          <>
                            <div className="fallback-mesh absolute inset-0"></div>
                            <img
                              src={resolveDisplayImage(product)}
                              alt={product.title}
                              className="h-48 w-full object-cover relative z-[1]"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                setBrokenImageIds((prev) => ({ ...prev, [product.id]: true }));
                              }}
                            />
                          </>
                        ) : (
                          <div className="h-48 w-full banner-card relative z-[1] p-4 flex flex-col" style={getBannerStyle(product)}>
                            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase backdrop-blur-sm self-start">
                              {product.category}
                            </span>
                            <div className="flex-1 flex items-center justify-center px-1">
                              <h3 className="text-white text-2xl font-extrabold leading-tight line-clamp-2 text-center">
                                {product.title}
                              </h3>
                            </div>
                          </div>
                        )}
                        <div className="p-4 relative z-[1]">
                          <p className="text-xs uppercase text-[var(--brand-strong)]">{product.category}</p>
                          <h3 className="text-main font-semibold mt-1 line-clamp-1">{product.title}</h3>
                          <p className="text-muted text-sm mt-1 line-clamp-2">{product.description}</p>
                          <p className="text-[var(--brand-strong)] font-bold mt-2">{'\u20B9'}{product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-3 mb-16 overflow-x-auto pb-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full text-sm transition-all ${
                    selectedCategory === category
                      ? 'bg-[var(--brand)] text-white font-bold'
                      : 'ghost-button text-main'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <section className="glass-card rounded-[2rem] p-10 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--brand)]/10 pointer-events-none"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-4 text-main">Moving out? Turn your stuff into cash.</h2>
                <p className="text-muted mb-8 max-w-xl mx-auto">
                  Upload your items in less than 30 seconds and reach thousands of students on your campus instantly.
                </p>
                <button onClick={() => setShowSellModal(true)} className="bg-white text-black font-black px-10 py-4 rounded-xl hover:scale-105 transition-transform">
                  List My First Item
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="glass-nav py-10 px-6 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <button onClick={goHome} className="flex items-center gap-3">
            <div className="size-6 bg-[var(--brand)]/40 rounded flex items-center justify-center text-white text-xs font-bold">S</div>
            <span className="text-lg font-bold tracking-tight text-muted">UniSwap</span>
          </button>
          <div className="flex gap-8 text-sm text-muted flex-wrap justify-center">
            <button className="hover:text-main transition-colors">Safety Tips</button>
            <button className="hover:text-main transition-colors">Privacy Policy</button>
            <button className="hover:text-main transition-colors">Terms of Service</button>
            <button className="hover:text-main transition-colors">Contact Campus Rep</button>
          </div>
        </div>
      </footer>

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onEdit={(product) => {
          setSelectedProduct(null);
          setEditingProduct(product);
        }}
      />

      <EditItemModal
        product={editingProduct}
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        onSuccess={fetchProducts}
      />

      <SellItemModal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
}

export default App;
