import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Clock, Users, Camera, CheckCircle, Ticket as TicketIcon, ChevronDown, Heart, GraduationCap, Briefcase, LogIn, LogOut, ShieldCheck, Download, XCircle, UserPlus, Banknote, MoreVertical, X, Search } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Alumnus {
  id: string;
  username?: string;
  password?: string;
  name: string;
  email: string;
  batch: string;
  group: string;
  address: string;
  extraMember: string;
  age: string;
  profession: string;
  phone: string;
  paymentMethod: string;
  trxId: string;
  status: 'pending' | 'approved';
  timestamp: number;
  photoUrl?: string;
  gender?: string;
  religion?: string;
  tshirtSize?: string;
  passwordResetRequest?: boolean;
}

type ViewState = 'home' | 'login' | 'dashboard';
type CurrentUser = { type: 'admin' } | { type: 'user', id: string } | null;

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

import { supabase } from './lib/supabase';

function App() {
  const [alumni, setAlumni] = useState<Alumnus[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [heroImages, setHeroImages] = useState<string[]>([
    'https://picsum.photos/seed/collegecampus/1920/1080',
    'https://picsum.photos/seed/reunion2/1920/1080',
    'https://picsum.photos/seed/reunion3/1920/1080'
  ]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Alumni
      const { data: alumniData, error: alumniError } = await supabase.from('alumni').select('*');
      if (alumniData) {
        setAlumni(alumniData);
      } else if (alumniError) {
        console.error('Failed to fetch alumni data from Supabase', alumniError);
      }

      // Fetch Hero Images
      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('value').eq('key', 'hero_images').single();
      if (settingsData && settingsData.value) {
        setHeroImages(settingsData.value);
      } else if (settingsError) {
        console.error('Failed to fetch hero images from Supabase', settingsError);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const saveAlumni = async (data: Alumnus[]) => {
    setAlumni(data);
    // Upsert all data to Supabase
    const { error } = await supabase.from('alumni').upsert(data);
    if (error) console.error('Error saving alumni to Supabase:', error);
  };

  const saveHeroImages = async (images: string[]) => {
    setHeroImages(images);
    const { error } = await supabase.from('settings').upsert({ key: 'hero_images', value: images });
    if (error) console.error('Error saving hero images to Supabase:', error);
  };

  const handleRegister = async (data: Omit<Alumnus, 'id' | 'timestamp' | 'status'>) => {
    // Check if username exists
    if (alumni.some(a => a.username === data.username)) {
      alert('Username already exists. Please choose another.');
      return false;
    }

    const newAlumnus: Alumnus = {
      ...data,
      id: crypto.randomUUID(),
      status: 'pending',
      timestamp: new Date().toISOString(),
      passwordResetRequest: false
    };
    
    const newAlumniList = [newAlumnus, ...alumni];
    setAlumni(newAlumniList);
    
    const { error } = await supabase.from('alumni').insert([newAlumnus]);
    if (error) {
      console.error('Error registering alumnus:', error);
      alert('Registration failed. Please try again.');
      return false;
    }

    setCurrentUser({ type: 'user', id: newAlumnus.id });
    navigate('/dashboard');
    return true;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-accent-500 selection:text-white scroll-smooth flex flex-col">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />
      
      <main className="flex-grow pt-20">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Hero heroImages={heroImages} />
                <About />
                <Gallery />
              </motion.div>
            } />
            <Route path="/schedule" element={
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Schedule />
              </motion.div>
            } />
            <Route path="/directory" element={
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Directory alumni={alumni.filter(a => a.status === 'approved')} />
              </motion.div>
            } />
            <Route path="/register" element={
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <RegistrationSection onRegister={handleRegister} />
              </motion.div>
            } />
            <Route path="/login" element={
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <LoginView alumni={alumni} setCurrentUser={setCurrentUser} saveAlumni={saveAlumni} />
              </motion.div>
            } />
            <Route path="/dashboard" element={
              currentUser ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  {currentUser.type === 'admin' ? (
                    <AdminDashboard alumni={alumni} saveAlumni={saveAlumni} heroImages={heroImages} saveHeroImages={saveHeroImages} />
                  ) : (
                    <UserDashboard user={alumni.find(a => a.id === currentUser.id)} />
                  )}
                </motion.div>
              ) : (
                <div className="p-12 text-center">Please login to view dashboard.</div>
              )
            } />
          </Routes>
        </AnimatePresence>
      </main>
      
      <Footer />
    </div>
  );
}

function Navbar({ currentUser, onLogout }: any) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary-950/95 backdrop-blur-md border-b border-white/10 shadow-sm">
      <div className="w-full px-4 md:px-8 lg:px-12 h-20 flex items-center justify-between">
        <Link 
          to="/"
          className="font-serif font-bold text-xl text-white flex items-center gap-3 cursor-pointer"
        >
          <img 
            src="https://scontent.fdac207-1.fna.fbcdn.net/v/t39.30808-6/616251871_897455862975204_928078188172932968_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeGtxNODHcSQg9TOcmk20t5zMcUvuc8mD64xxS-5zyYPrnv3WhngbL_QnwW5iy71keNwtm5btR00X06b3RCE8AUY&_nc_ohc=8y91RxZICXkQ7kNvwFymr4J&_nc_oc=AdpPcBbPVdv5t3Vp43yG7o2hJWPT5e9BNw_IoQ5VdbPwIZug2wuU8yQ6Ui_DLYXmoZQ&_nc_zt=23&_nc_ht=scontent.fdac207-1.fna&_nc_gid=ZoLS0D_kz0vcqr_BvY5CLg&_nc_ss=7a3a8&oh=00_Af3Z2rqBdC58FBmF888Nmw0VtEnPZyhp2c90jnKhQ8fB5Q&oe=69D59830" 
            alt="SLC Alumni Logo" 
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-white/20"
            referrerPolicy="no-referrer"
          />
          <span className="hidden sm:inline">SLC Reunion</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link to="/" className={`hover:text-white transition-colors ${location.pathname === '/' ? 'text-accent-400 font-bold' : ''}`}>Home</Link>
          <Link to="/schedule" className={`hover:text-white transition-colors ${location.pathname === '/schedule' ? 'text-accent-400 font-bold' : ''}`}>Schedule</Link>
          <Link to="/directory" className={`hover:text-white transition-colors ${location.pathname === '/directory' ? 'text-accent-400 font-bold' : ''}`}>Directory</Link>
          <Link to="/register" className={`hover:text-white transition-colors ${location.pathname === '/register' ? 'text-accent-400 font-bold' : ''}`}>Register</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {currentUser ? (
            <>
              <Link 
                to="/dashboard"
                className="text-sm font-medium text-accent-400 hover:text-accent-300 transition-colors"
              >
                Dashboard
              </Link>
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Link 
                  to="/login"
                  className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:bg-white/10 hover:text-white rounded-full transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MoreVertical className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary-900 border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`font-medium py-2 border-b border-white/10 ${location.pathname === '/' ? 'text-accent-400 font-bold' : 'text-slate-300'}`}>Home</Link>
              <Link to="/schedule" onClick={() => setIsMobileMenuOpen(false)} className={`font-medium py-2 border-b border-white/10 ${location.pathname === '/schedule' ? 'text-accent-400 font-bold' : 'text-slate-300'}`}>Schedule</Link>
              <Link to="/directory" onClick={() => setIsMobileMenuOpen(false)} className={`font-medium py-2 border-b border-white/10 ${location.pathname === '/directory' ? 'text-accent-400 font-bold' : 'text-slate-300'}`}>Directory</Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className={`font-medium py-2 border-b border-white/10 ${location.pathname === '/register' ? 'text-accent-400 font-bold' : 'text-slate-300'}`}>Register</Link>
              
              <div className="pt-2 flex flex-col gap-3">
                {currentUser ? (
                  <>
                    <Link 
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-left font-medium text-accent-400 py-2"
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    {location.pathname !== '/login' && (
                      <Link 
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-5 py-3 rounded-xl font-medium transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        Login
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex justify-center gap-3 sm:gap-4 mb-10">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px]">
          <span className="text-2xl sm:text-4xl font-bold text-accent-400 font-mono">
            {item.value.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider mt-1 font-medium">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Hero({ heroImages }: { heroImages: string[] }) {
  const reunionDate = new Date('2026-05-11T00:00:00');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!heroImages || heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages]);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-primary-950 text-white">
      <div className="absolute inset-0 opacity-30">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentIndex}
            src={heroImages[currentIndex] || 'https://picsum.photos/seed/collegecampus/1920/1080'}
            alt="Campus"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-900/80 to-transparent z-10" />
      </div>
      
      <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 text-center pt-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="inline-block py-1.5 px-4 rounded-full bg-accent-500/20 text-accent-400 border border-accent-500/30 text-sm font-medium tracking-wider uppercase mb-6">
            Grand Reunion 2026
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
            Welcome Back to <br/>
            <span className="text-accent-400">Savar Legend College</span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto font-light">
            Relive the memories, reconnect with old friends, and celebrate the legacy we built together.
          </p>

          <CountdownTimer targetDate={reunionDate} />
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 text-slate-200 bg-white/10 px-5 py-3 rounded-xl backdrop-blur-md border border-white/10">
              <Calendar className="w-5 h-5 text-accent-400" />
              <span className="font-medium">May 11, 2026</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200 bg-white/10 px-5 py-3 rounded-xl backdrop-blur-md border border-white/10">
              <MapPin className="w-5 h-5 text-accent-400" />
              <span className="font-medium">College Campus Grounds</span>
            </div>
          </div>
          
          <Link to="/register" className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 shadow-lg shadow-accent-500/30">
            Register Now
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="w-full px-4 md:px-8 lg:px-12 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}>
          <Heart className="w-12 h-12 text-accent-500 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary-950 mb-8">A Journey Back in Time</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            It feels like just yesterday we were walking these halls, dreaming about the future. Now, years later, it's time to come home. The Savar Legend College Alumni Association invites you to a day filled with nostalgia, laughter, and heartfelt reunions.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Schedule() {
  const sessions = [
    {
      title: "First Session",
      events: [
        {
          id: "01",
          time: "8:00 AM - 10:00 AM",
          title: "Opening Session",
          details: [
            "Registration - Collect token from designated booth.",
            "Gift - Collect gift using token from designated booth.",
            "Breakfast - Collect breakfast using token from designated booth."
          ]
        },
        {
          id: "02",
          time: "9:00 AM - 9:45 AM",
          title: "Rally",
          details: ["'March of Peace Drawn by Roots'"]
        },
        {
          id: "03",
          time: "10:00 AM - 10:45 AM",
          title: "Inauguration",
          details: [
            "Quran Recitation",
            "Gita Reading",
            "National Anthem & Flag Hoisting",
            "Event Inauguration"
          ]
        }
      ]
    },
    {
      title: "Second Session",
      events: [
        {
          id: "01",
          time: "10:46 AM - 11:30 AM",
          title: "2nd Session",
          details: [
            "College Song",
            "Cultural Performance",
            "Reminiscence",
            "Photo Session"
          ]
        },
        {
          id: "02",
          time: "11:30 AM - 12:30 PM",
          title: "Speech",
          details: ["Batch-wise Speech"]
        },
        {
          id: "03",
          time: "12:30 PM - 12:45 PM",
          title: "Speech",
          details: ["Speech by Honorable Teachers"]
        },
        {
          id: "04",
          time: "12:46 PM - 02:30 PM",
          title: "Break",
          details: ["Prayer and Lunch Break"]
        }
      ]
    },
    {
      title: "Third Session",
      events: [
        {
          id: "01",
          time: "02:00 PM - 04:11 PM",
          title: "3rd Session",
          details: [
            "Patriotic Songs",
            "Crest Presentation",
            "Special Honors Presentation",
            "Guests' Speech"
          ]
        },
        {
          id: "02",
          time: "04:11 PM - 05:30 PM",
          title: "Break",
          details: ["Maghrib Prayer Break"]
        },
        {
          id: "03",
          time: "05:45 PM - 06:45 PM",
          title: "Cultural Program",
          details: ["Pleasant Cultural Evening"]
        },
        {
          id: "04",
          time: "06:46 PM - 07:15 PM",
          title: "Raffle Draw",
          details: ["Attractive Raffle Draw for all attendees"]
        },
        {
          id: "05",
          time: "07:15 PM - 07:45 PM",
          title: "Break",
          details: ["Isha Prayer Break"]
        },
        {
          id: "06",
          time: "07:46 PM - 09:00 PM",
          title: "Music",
          details: ["Qawwali Music Session"]
        },
        {
          id: "07",
          time: "09:00 PM - 09:15 PM",
          title: "Closing Ceremony",
          details: ["Closing Declaration and Closing Speech"]
        }
      ]
    }
  ];

  return (
    <section id="schedule" className="py-24 bg-slate-50">
      <div className="w-full px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary-950 mb-4">Program Schedule</h2>
          <p className="text-slate-500 text-lg">A day full of memories, joy, and celebration.</p>
        </div>
        
        <div className="space-y-16">
          {sessions.map((session, sIdx) => (
            <div key={sIdx}>
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-2xl font-bold text-accent-600">{session.title}</h3>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {session.events.map((event, eIdx) => (
                  <motion.div 
                    key={eIdx} 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true, margin: "-50px" }} 
                    transition={{ duration: 0.4, delay: eIdx * 0.1 }} 
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl font-black text-slate-100">{event.id}</span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          {event.time}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-primary-950 mb-3">{event.title}</h4>
                      <ul className="space-y-2">
                        {event.details.map((detail, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2 text-slate-600 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-1.5 shrink-0"></div>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="inline-flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Note: The schedule is subject to change at any time.
          </p>
        </div>
      </div>
    </section>
  );
}

function RegistrationSection({ onRegister }: { onRegister: any }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    batch: '1st',
    group: 'Science',
    address: '',
    extraMember: '0',
    age: '',
    profession: '',
    phone: '',
    paymentMethod: 'bKash',
    trxId: '',
    photoUrl: '',
    gender: 'Male',
    religion: 'Muslim',
    tshirtSize: 'M'
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(formData);
  };

  return (
    <section id="register" className="py-24 bg-primary-950 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-primary-600/20 rounded-full blur-3xl" />
      
      <div className="w-full px-4 md:px-8 lg:px-12 max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 leading-tight">Registration Instructions</h2>
            
            <div className="space-y-6 text-slate-300">
              <div>
                <h3 className="text-xl font-bold text-accent-400 mb-3">Guidelines</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
                  <li>Personal information must be filled out correctly in the provided form.</li>
                  <li>The form must be submitted after paying the registration fee.</li>
                  <li>Registration fee can be paid via Bank Account, bKash, Nagad, or Rocket.</li>
                  <li>In all cases, the Transaction ID must be provided in the form.</li>
                  <li>If the registration fee is not paid, the registration will be considered incomplete.</li>
                  <li>A passport-size photo must be uploaded. (Providing a photo is not mandatory for female alumni. They can provide a photo with a niqab if they wish.)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-accent-400 mb-3">2 Easy Steps for Registration</h3>
                <div className="space-y-4">
                  <div className="bg-primary-900/50 p-4 rounded-xl border border-primary-800">
                    <h4 className="font-bold text-white mb-2">Step 1: Fill out the form</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Upload photo and fill in personal information</li>
                      <li>Provide mobile number and email ID</li>
                    </ul>
                  </div>
                  <div className="bg-primary-900/50 p-4 rounded-xl border border-primary-800">
                    <h4 className="font-bold text-white mb-2">Step 2: Registration Fee Payment</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Bank Transfer (Provide Transaction ID)</li>
                      <li>bKash / Nagad / Rocket Payment (Provide Transaction ID)</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                <XCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">
                  <strong>Note:</strong> If the registration fee is not paid, the registration will be considered incomplete.
                </p>
              </div>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl p-8 md:p-10 text-slate-900 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-2xl font-bold text-primary-950 mb-6">Registration Form</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Username (for login)</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="johndoe99" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input required type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input required type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="johndoe@gmail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Profile Picture</label>
                <div className="flex items-center gap-4">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-primary-500" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Batch</label>
                  <select required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})}>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="3rd">3rd</option>
                    <option value="4th">4th</option>
                    <option value="5th">5th</option>
                    <option value="6th">6th</option>
                    <option value="7th">7th</option>
                    <option value="8th">8th</option>
                    <option value="9th">9th</option>
                    <option value="10th">10th</option>
                    <option value="11th">11th</option>
                    <option value="12th">12th</option>
                    <option value="13th">13th</option>
                    <option value="14th">14th</option>
                    <option value="15th">15th</option>
                    <option value="16th">16th</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Group</label>
                  <select required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})}>
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                  <select required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Religion</label>
                  <select required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value})}>
                    <option value="Muslim">Muslim</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Christian">Christian</option>
                    <option value="Buddhist">Buddhist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">T-Shirt Size</label>
                  <select required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={formData.tshirtSize} onChange={e => setFormData({...formData, tshirtSize: e.target.value})}>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Age</label>
                  <input required type="number" min="15" max="100" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. 22" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Extra Guest(s)</label>
                  <select required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={formData.extraMember} onChange={e => setFormData({...formData, extraMember: e.target.value})}>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>

              <div className="bg-primary-50 p-5 rounded-xl border border-primary-100 flex justify-between items-center">
                <div>
                  <p className="text-sm text-primary-700 font-medium">Registration Fee (৳1500)</p>
                  {parseInt(formData.extraMember) > 0 && (
                    <p className="text-sm text-primary-700 font-medium">Extra Guest(s): {formData.extraMember} × ৳1000</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-primary-600 font-bold uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-primary-900">৳{1500 + (parseInt(formData.extraMember) || 0) * 1000}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Your current address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Profession</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Software Engineer" value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                  <input required type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="01XXXXXXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: 'bKash'})}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${formData.paymentMethod === 'bKash' ? 'border-[#e2136e] bg-[#e2136e]/10' : 'border-slate-200 hover:border-[#e2136e]/30'}`}
                  >
                    <img src="https://freelogopng.com/images/all_img/1656227518bkash-logo-png.png" alt="bKash" className="h-8 object-contain" referrerPolicy="no-referrer" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: 'Nagad'})}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${formData.paymentMethod === 'Nagad' ? 'border-[#f7931e] bg-[#f7931e]/10' : 'border-slate-200 hover:border-[#f7931e]/30'}`}
                  >
                    <img src="https://freelogopng.com/images/all_img/1679248787Nagad-Logo.png" alt="Nagad" className="h-8 object-contain" referrerPolicy="no-referrer" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: 'Rocket'})}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${formData.paymentMethod === 'Rocket' ? 'border-[#8c1596] bg-[#8c1596]/10' : 'border-slate-200 hover:border-[#8c1596]/30'}`}
                  >
                    <img src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1EA458A-seeklogo.com.png" alt="Rocket" className="h-8 object-contain" referrerPolicy="no-referrer" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{formData.paymentMethod} Transaction ID</label>
                <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="8A7B6C5D4E" value={formData.trxId} onChange={e => setFormData({...formData, trxId: e.target.value})} />
              </div>
              
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-xl mt-8 transition-colors shadow-lg shadow-primary-600/30 text-lg">
                Submit Registration
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Directory({ alumni }: { alumni: Alumnus[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  
  const batches = ['All', ...Array.from(new Set(alumni.map(a => a.batch)))].sort();
  
  const filteredAlumni = alumni.filter(person => {
    const matchesSearch = person.name ? person.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const matchesBatch = selectedBatch === 'All' || person.batch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  return (
    <section id="directory" className="py-24 bg-slate-50">
      <div className="w-full px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary-950 mb-4">Alumni Directory</h2>
          <p className="text-slate-600 text-lg">See who's coming! {alumni.length > 0 ? `${alumni.length} alumni have been approved.` : 'Registrations are pending approval.'}</p>
        </div>
        
        {alumni.length > 0 && (
          <div className="max-w-2xl mx-auto mb-12 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                placeholder="Search alumni by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm bg-white sm:w-48"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              {batches.map(batch => (
                <option key={batch} value={batch}>{batch === 'All' ? 'All Batches' : `Batch ${batch}`}</option>
              ))}
            </select>
          </div>
        )}
        
        {alumni.length > 0 ? (
          filteredAlumni.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlumni.map((person, idx) => (
                <motion.div key={person.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: (idx % 3) * 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt={person.name} className="w-14 h-14 rounded-full object-cover shrink-0 border border-slate-200" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-2xl shrink-0">
                      {person.name ? person.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-primary-950 text-lg leading-tight mb-1">{person.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1.5"><GraduationCap className="w-4 h-4 text-slate-400" /><span>Batch of {person.batch} • {person.group}</span></div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1"><MapPin className="w-4 h-4 text-slate-400" /><span className="line-clamp-1">{person.address}</span></div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1"><Briefcase className="w-4 h-4 text-slate-400" /><span className="line-clamp-1">{person.profession}</span></div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 border-dashed">
              <p className="text-slate-500 text-lg">No alumni found matching "{searchQuery}".</p>
            </div>
          )
        ) : (
          <div className="text-center p-16 bg-white rounded-3xl border border-slate-200 border-dashed">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No approved registrations yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Gallery() {
  const photos = [
    "https://picsum.photos/seed/college1/800/600",
    "https://picsum.photos/seed/college2/600/800",
    "https://picsum.photos/seed/college3/800/800",
  ];
  return (
    <section id="gallery" className="py-24 bg-white">
      <div className="w-full px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 text-center md:text-left gap-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary-950 mb-4">Golden Memories</h2>
            <p className="text-slate-600 text-lg">Glimpses of our unforgettable campus life.</p>
          </div>
        </div>
        <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
          {photos.map((src, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, scale: 0.95 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true, margin: "-50px" }} 
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="break-inside-avoid rounded-2xl overflow-hidden group relative"
            >
              <img src={src} alt={`Memory ${idx + 1}`} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LoginView({ alumni, setCurrentUser, saveAlumni }: any) {
  const [tab, setTab] = useState<'user' | 'admin'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'admin') {
      if (username === 'admin' && password === 'admin123') {
        setCurrentUser({ type: 'admin' });
        navigate('/dashboard');
      } else {
        setError('Invalid admin credentials. (Hint: admin / admin123)');
      }
    } else {
      const user = alumni.find((a: Alumnus) => a.username === username && a.password === password);
      if (user) {
        setCurrentUser({ type: 'user', id: user.id });
        navigate('/dashboard');
      } else {
        setError('Invalid username or password.');
      }
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess(false);

    const userIndex = alumni.findIndex((a: Alumnus) => a.username === username);
    if (userIndex !== -1) {
      const updatedAlumni = [...alumni];
      updatedAlumni[userIndex] = { ...updatedAlumni[userIndex], passwordResetRequest: true };
      saveAlumni(updatedAlumni);
      setResetSuccess(true);
      setTimeout(() => {
        setIsForgotPassword(false);
        setResetSuccess(false);
        setUsername('');
      }, 3000);
    } else {
      setError('Username not found.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md">
        {!isForgotPassword && (
          <div className="flex gap-4 mb-8 bg-slate-100 p-1.5 rounded-xl">
            <button 
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'user' ? 'bg-white text-primary-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setTab('user'); setError(''); }}
            >
              Alumni Login
            </button>
            <button 
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'admin' ? 'bg-white text-primary-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setTab('admin'); setError(''); }}
            >
              Admin Login
            </button>
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-primary-950 mb-2">
            {isForgotPassword ? 'Reset Password' : tab === 'admin' ? 'Admin Portal' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 text-sm">
            {isForgotPassword ? 'Request an admin to reset your password' : tab === 'admin' ? 'Manage registrations and approvals' : 'Login to view your ticket and status'}
          </p>
        </div>

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}
            {resetSuccess && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">
                Password reset request sent to admin successfully.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl mt-4 transition-colors">
              Request Reset
            </button>
            <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); setResetSuccess(false); }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl mt-2 transition-colors">
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                {tab === 'user' && (
                  <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); }} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                    Forgot Password?
                  </button>
                )}
              </div>
              <input required type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl mt-4 transition-colors">
              Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function AdminDashboard({ alumni, saveAlumni, heroImages, saveHeroImages }: any) {
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleApprove = (id: string) => {
    const updated = alumni.map((a: Alumnus) => a.id === id ? { ...a, status: 'approved' } : a);
    saveAlumni(updated);
  };

  const handleReject = async (id: string) => {
    if(confirm('Are you sure you want to reject and delete this registration?')) {
      const { error } = await supabase.from('alumni').delete().eq('id', id);
      if (error) {
        console.error('Error deleting alumnus:', error);
        alert('Failed to delete registration.');
      } else {
        const updated = alumni.filter((a: Alumnus) => a.id !== id);
        // We only update local state here because delete is already done on Supabase.
        // If we call saveAlumni, it will try to upsert the remaining, which is fine but redundant.
        // However, to keep it simple and consistent with the prop, we can just call saveAlumni.
        saveAlumni(updated);
      }
    }
  };

  const handleResetPassword = (id: string) => {
    const newPassword = prompt('Enter the new password for this user:');
    if (newPassword && newPassword.trim() !== '') {
      const updated = alumni.map((a: Alumnus) => a.id === id ? { ...a, password: newPassword.trim(), passwordResetRequest: false } : a);
      saveAlumni(updated);
      alert(`Password reset successfully to: ${newPassword.trim()}`);
    } else if (newPassword !== null) {
      alert('Password reset cancelled. Password cannot be empty.');
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      saveHeroImages([...heroImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = heroImages.filter((_: any, i: number) => i !== index);
    saveHeroImages(updated);
  };

  const pending = alumni.filter((a: Alumnus) => a.status === 'pending');
  const approved = alumni.filter((a: Alumnus) => a.status === 'approved');
  const resetRequests = alumni.filter((a: Alumnus) => a.passwordResetRequest);

  const totalRegistered = alumni.length;
  const totalExtraGuests = alumni.reduce((sum: number, a: Alumnus) => sum + (parseInt(a.extraMember) || 0), 0);
  
  const paymentStats = alumni.reduce((acc: Record<string, number>, a: Alumnus) => {
    const amount = 1500 + (parseInt(a.extraMember) || 0) * 1000;
    const method = a.paymentMethod || 'Unknown';
    acc[method] = (acc[method] || 0) + amount;
    acc['total'] = (acc['total'] || 0) + amount;
    return acc;
  }, { total: 0, bKash: 0, Nagad: 0, Rocket: 0 });

  const batchStats = alumni.reduce((acc: Record<string, number>, a: Alumnus) => {
    acc[a.batch] = (acc[a.batch] || 0) + 1;
    return acc;
  }, {});

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Add Heading
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Savar Legend College Alumni Reunion', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105); // slate-500
    doc.text('Registration & Revenue Report', 105, 28, { align: 'center' });
    
    // Add Summary
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Registrations: ${totalRegistered}`, 14, 45);
    doc.text(`Total Extra Guests: ${totalExtraGuests}`, 14, 52);
    doc.text(`Total Revenue: BDT ${paymentStats.total.toLocaleString()}`, 14, 59);

    // Batch-wise Table
    const batchTableData = Object.entries(batchStats)
      .sort((a, b) => {
        const numA = parseInt(a[0]) || 0;
        const numB = parseInt(b[0]) || 0;
        return numA - numB;
      })
      .map(([batch, count]) => [
        `Batch ${batch}`, 
        (count as number).toString(), 
        `BDT ${alumni.filter((a: Alumnus) => a.batch === batch).reduce((sum: number, a: Alumnus) => sum + 1500 + (parseInt(a.extraMember) || 0) * 1000, 0).toLocaleString()}`
      ]);

    autoTable(doc, {
      startY: 70,
      head: [['Batch', 'Total Registrations', 'Revenue']],
      body: batchTableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }, // blue-600
      styles: { fontSize: 10 },
    });

    // Payment Method Table
    const finalY = (doc as any).lastAutoTable.finalY || 70;
    
    const paymentTableData = [
      ['bKash', `BDT ${paymentStats.bKash?.toLocaleString() || 0}`],
      ['Nagad', `BDT ${paymentStats.Nagad?.toLocaleString() || 0}`],
      ['Rocket', `BDT ${paymentStats.Rocket?.toLocaleString() || 0}`]
    ];

    autoTable(doc, {
      startY: finalY + 15,
      head: [['Payment Method', 'Collected Amount']],
      body: paymentTableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }, // slate-900
      styles: { fontSize: 10 },
    });

    // Save PDF
    doc.save('Reunion_Report.pdf');
  };

  const downloadAlumniListPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Add Heading
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Savar Legend College Alumni Reunion', 148.5, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105); // slate-500
    doc.text('Registered Alumni List', 148.5, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 38);
    
    const tableData = alumni.map((a: Alumnus, index: number) => [
      index + 1,
      a.name,
      a.email,
      a.phone,
      a.batch,
      a.group,
      a.age,
      a.profession,
      a.address,
      a.gender || '-',
      a.religion || '-',
      a.tshirtSize || '-',
      a.extraMember,
      a.paymentMethod,
      a.trxId,
      a.status ? a.status.toUpperCase() : 'PENDING'
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['#', 'Name', 'Email', 'Phone', 'Batch', 'Group', 'Age', 'Profession', 'Address', 'Gender', 'Religion', 'T-Shirt', 'Guests', 'Payment', 'TrxID', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }, // blue-600
      styles: { fontSize: 6, cellPadding: 1.5, overflow: 'linebreak' },
    });

    doc.save('Alumni_Full_List.pdf');
  };

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 py-12 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-primary-950">Admin Dashboard</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={downloadAlumniListPDF} className="flex items-center justify-center gap-2 bg-white text-primary-700 border border-primary-200 px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors font-medium shadow-sm">
            <Download className="w-4 h-4" />
            Download Alumni List
          </button>
          <button onClick={generatePDFReport} className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-sm">
            <Download className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="mb-12 space-y-6">
        <h2 className="text-xl font-bold text-primary-950">Overview Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Registrations</p>
              <p className="text-2xl font-bold text-slate-900">{totalRegistered}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Extra Guests</p>
              <p className="text-2xl font-bold text-slate-900">{totalExtraGuests}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">৳{paymentStats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Batch-wise Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Registrations by Batch</h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
              {Object.entries(batchStats).sort((a, b) => b[0].localeCompare(a[0])).map(([batch, count]) => (
                <div key={batch} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">Batch {batch}</span>
                  <span className="bg-white px-3 py-1 rounded-lg text-sm font-bold text-primary-600 shadow-sm">{count as React.ReactNode}</span>
                </div>
              ))}
              {Object.keys(batchStats).length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No registrations yet</p>
              )}
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Revenue by Payment Method</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#e2136e]/5 border border-[#e2136e]/20">
                <div className="flex items-center gap-3">
                  <img src="https://freelogopng.com/images/all_img/1656227518bkash-logo-png.png" alt="bKash" className="h-6 object-contain" referrerPolicy="no-referrer" />
                  <span className="font-medium text-slate-700">bKash</span>
                </div>
                <span className="font-bold text-[#e2136e]">৳{paymentStats.bKash?.toLocaleString() || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f7931e]/5 border border-[#f7931e]/20">
                <div className="flex items-center gap-3">
                  <img src="https://freelogopng.com/images/all_img/1679248787Nagad-Logo.png" alt="Nagad" className="h-6 object-contain" referrerPolicy="no-referrer" />
                  <span className="font-medium text-slate-700">Nagad</span>
                </div>
                <span className="font-bold text-[#f7931e]">৳{paymentStats.Nagad?.toLocaleString() || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#8c1596]/5 border border-[#8c1596]/20">
                <div className="flex items-center gap-3">
                  <img src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1EA458A-seeklogo.com.png" alt="Rocket" className="h-6 object-contain" referrerPolicy="no-referrer" />
                  <span className="font-medium text-slate-700">Rocket</span>
                </div>
                <span className="font-bold text-[#8c1596]">৳{paymentStats.Rocket?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Slider Images Management */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-primary-950 mb-6">Hero Slider Images</h2>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Enter image URL..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
            />
            <button
              onClick={handleAddImage}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-medium transition-colors whitespace-nowrap"
            >
              Add Image
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {heroImages && heroImages.map((url: string, idx: number) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                <img src={url} alt={`Slider ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {(!heroImages || heroImages.length === 0) && (
              <div className="col-span-full py-8 text-center text-slate-500">
                No images added. The default placeholder will be shown.
              </div>
            )}
          </div>
        </div>
      </div>

      {resetRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden mb-12">
          <div className="p-6 border-b border-amber-200 bg-amber-50">
            <h2 className="text-xl font-bold text-amber-900">Password Reset Requests ({resetRequests.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-50/50 text-amber-700 border-b border-amber-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Name & Batch</th>
                  <th className="px-6 py-4 font-medium">Username</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {resetRequests.map((a: Alumnus) => (
                  <tr key={a.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{a.name}</div>
                      <div className="text-slate-500 text-xs mt-0.5">Batch {a.batch}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{a.username}</td>
                    <td className="px-6 py-4 text-slate-600">{a.phone}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleResetPassword(a.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-primary-950">Pending Approvals ({pending.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Name & Batch</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">TrxID</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No pending registrations</td></tr>
              ) : pending.map((user: Alumnus) => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-slate-500 text-xs">Batch {user.batch} • {user.group}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700">{user.phone}</p>
                    <p className="text-slate-500 text-xs">{user.email}</p>
                    <p className="text-slate-500 text-xs">{user.profession}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      {user.paymentMethod === 'bKash' && <img src="https://freelogopng.com/images/all_img/1656227518bkash-logo-png.png" alt="bKash" className="h-4 object-contain" referrerPolicy="no-referrer" />}
                      {user.paymentMethod === 'Nagad' && <img src="https://freelogopng.com/images/all_img/1679248787Nagad-Logo.png" alt="Nagad" className="h-4 object-contain" referrerPolicy="no-referrer" />}
                      {user.paymentMethod === 'Rocket' && <img src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1EA458A-seeklogo.com.png" alt="Rocket" className="h-4 object-contain" referrerPolicy="no-referrer" />}
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        user.paymentMethod === 'bKash' ? 'bg-[#e2136e]/10 text-[#e2136e]' :
                        user.paymentMethod === 'Nagad' ? 'bg-[#f7931e]/10 text-[#f7931e]' :
                        user.paymentMethod === 'Rocket' ? 'bg-[#8c1596]/10 text-[#8c1596]' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {user.paymentMethod || 'Unknown'}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-600">{user.trxId}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleApprove(user.id)} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-bold mr-2 transition-colors">Approve</button>
                    <button onClick={() => handleReject(user.id)} className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-primary-950">Approved Alumni ({approved.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Name & Batch</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approved.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No approved registrations yet</td></tr>
              ) : approved.map((user: Alumnus) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-slate-500 text-xs">Batch {user.batch} • {user.group}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700">{user.phone}</p>
                    <p className="text-slate-500 text-xs">{user.email}</p>
                  </td>
                  <td className="px-6 py-4"><span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium"><CheckCircle className="w-3 h-3"/> Approved</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UserDashboard({ user }: { user?: Alumnus }) {
  const ticketRef = useRef<HTMLDivElement>(null);

  if (!user) return <div className="p-12 text-center">User not found</div>;

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SLC_Reunion_Ticket_${user.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to download ticket. Please try again.');
    }
  };

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 py-12 max-w-md mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-primary-950 mb-2">Hello, {user.name}!</h1>
        <p className="text-slate-600">Welcome to your reunion dashboard.</p>
      </div>

      {user.status === 'pending' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-amber-900 mb-2">Registration Pending</h2>
          <p className="text-amber-700 max-w-md mx-auto">
            Your registration is currently under review by the admin. Once your {user.paymentMethod || ''} payment (TrxID: {user.trxId}) is verified, your digital ticket will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 text-lg">Registration Approved</h3>
                <p className="text-green-700 text-sm">Your ticket is ready for the event.</p>
              </div>
            </div>
            <button 
              onClick={downloadTicket}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {/* Modern Ticket Design */}
          <div className="overflow-x-auto pb-8">
            <div 
              ref={ticketRef}
              id="modern-ticket" 
              className="flex w-full min-w-[700px] max-w-3xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 relative"
            >
              {/* Left Side: Details */}
              <div className="flex-1 p-8 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950 text-white relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-accent-400 mb-1 tracking-wide">SLC Reunion '26</h2>
                      <p className="text-slate-300 text-sm font-medium">Savar Legend College Alumni Association</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-accent-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Admit One</p>
                      <p className="text-3xl font-bold tracking-tight">{user.name}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/10">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Batch</p>
                        <p className="text-lg font-semibold text-slate-100">{user.batch}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Group</p>
                        <p className="text-lg font-semibold text-slate-100">{user.group}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Extra Guests</p>
                        <p className="text-lg font-semibold text-slate-100">{user.extraMember}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/10">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Gender</p>
                        <p className="text-sm font-semibold text-slate-100">{user.gender || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Religion</p>
                        <p className="text-sm font-semibold text-slate-100">{user.religion || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">T-Shirt</p>
                        <p className="text-sm font-semibold text-slate-100">{user.tshirtSize || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-2 text-sm text-slate-300">
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-accent-400" /> Dec 25, 2026</div>
                      <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-accent-400" /> College Campus</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="w-10 relative bg-white flex flex-col items-center justify-between py-4 shrink-0">
                <div className="w-8 h-8 bg-slate-50 rounded-full absolute -top-4 shadow-inner"></div>
                <div className="w-0 h-full border-l-[3px] border-dashed border-slate-200 my-4"></div>
                <div className="w-8 h-8 bg-slate-50 rounded-full absolute -bottom-4 shadow-inner"></div>
              </div>

              {/* Right Side: Stub & Barcode */}
              <div className="w-64 bg-white p-6 flex flex-col justify-between items-center text-center relative shrink-0">
                <div className="w-full">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Ticket ID</p>
                  <p className="font-mono text-xl font-bold text-primary-950 tracking-wider">{user.id ? user.id.toUpperCase() : 'N/A'}</p>
                </div>
                
                <div className="w-full my-6">
                  {/* Fake Barcode Generator using CSS */}
                  <div className="w-full h-20 bg-primary-950 flex justify-between px-2 py-1 mb-2 rounded-sm" 
                       style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, white 2px, white 5px, transparent 5px, transparent 8px, white 8px, white 9px, transparent 9px, transparent 12px, white 12px, white 15px)' }}>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">TRX: {user.trxId}</p>
                </div>
                
                <div className="w-full">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">VIP Entry</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Footer() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending email
    console.log('Sending email:', formData);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <footer className="bg-primary-950 text-slate-400 py-16 border-t border-white/10 mt-auto">
      <div className="w-full px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <img 
              src="https://scontent.fdac207-1.fna.fbcdn.net/v/t39.30808-6/616251871_897455862975204_928078188172932968_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeGtxNODHcSQg9TOcmk20t5zMcUvuc8mD64xxS-5zyYPrnv3WhngbL_QnwW5iy71keNwtm5btR00X06b3RCE8AUY&_nc_ohc=8y91RxZICXkQ7kNvwFymr4J&_nc_oc=AdpPcBbPVdv5t3Vp43yG7o2hJWPT5e9BNw_IoQ5VdbPwIZug2wuU8yQ6Ui_DLYXmoZQ&_nc_zt=23&_nc_ht=scontent.fdac207-1.fna&_nc_gid=ZoLS0D_kz0vcqr_BvY5CLg&_nc_ss=7a3a8&oh=00_Af3Z2rqBdC58FBmF888Nmw0VtEnPZyhp2c90jnKhQ8fB5Q&oe=69D59830" 
              alt="SLC Alumni Logo" 
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-700 shadow-lg mb-6"
              referrerPolicy="no-referrer"
            />
            <h3 className="text-2xl font-serif font-bold text-white mb-4">Savar Legend College Alumni Association</h3>
            <p className="text-slate-400 mb-6 max-w-md">
              Reconnecting graduates, celebrating achievements, and building a stronger community for the future.
            </p>
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} SLC Alumni Association. All rights reserved.</p>
          </div>
          
          <div className="bg-primary-900/50 p-8 rounded-2xl border border-white/5">
            <h4 className="text-xl font-bold text-white mb-6">Contact Us</h4>
            {isSubmitted ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <p>Thank you for your message! We will get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input required type="text" placeholder="Your Name" className="w-full px-4 py-3 rounded-xl bg-primary-950/50 border border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-accent-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <input required type="email" placeholder="Your Email" className="w-full px-4 py-3 rounded-xl bg-primary-950/50 border border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-accent-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
                <div>
                  <input required type="text" placeholder="Subject" className="w-full px-4 py-3 rounded-xl bg-primary-950/50 border border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-accent-500 outline-none" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
                <div>
                  <textarea required placeholder="Your Message" rows={4} className="w-full px-4 py-3 rounded-xl bg-primary-950/50 border border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-accent-500 outline-none resize-none" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                </div>
                <button type="submit" className="w-full bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 rounded-xl transition-colors">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
