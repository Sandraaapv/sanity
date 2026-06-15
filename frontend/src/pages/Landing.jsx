import React, { useState } from 'react';
import { Zap, CheckSquare, FileText, Calendar, ArrowRight, ChevronDown, Check, Star, Shield, Users, Activity, BarChart2 } from 'lucide-react';

export default function Landing({ onGetStarted }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: CheckSquare,
      title: "Structured Lists",
      desc: "Group checklist tasks into folders, monitor completion progress, and track due dates."
    },
    {
      icon: FileText,
      title: "Rich Notes",
      desc: "Jot down brainstorm logs, pin crucial checklists, and customize color codes to catalog ideas."
    },
    {
      icon: Calendar,
      title: "Agenda Calendar",
      desc: "A gorgeous monthly grid view to map out work events, with pre-filled day schedules and alerts."
    }
  ];

  const faqs = [
    {
      q: "What is Momentum?",
      a: "Momentum is an integrated workspace that aggregates your daily notes, categorized checklists, and schedules under a single premium interface, keeping your cognitive load low and execution speed high."
    },
    {
      q: "Can I manage projects in categories?",
      a: "Absolutely! You can cluster checklist items into designated groupings (like Work, Study, or Shopping) and toggle categories dynamically in the sidebar count filters."
    },
    {
      q: "Does it support reminders?",
      a: "Yes, calendar events support automatic alert triggers. You can specify minutes-before intervals, and the backend handles sending SMTP notifications."
    },
    {
      q: "Is there a light mode available?",
      a: "Yes, you can toggle between our premium dark-tech canvas and a clean minimalist light mode from the user profile settings page."
    }
  ];

  const stats = [
    { value: "48%", label: "Focus Efficiency" },
    { value: "10x", label: "Task Coordination" },
    { value: "2.4h", label: "Time Saved Daily" },
    { value: "99.9%", label: "Cloud Workspace Uptime" }
  ];

  const pricing = [
    {
      name: "Starter",
      price: "$0",
      desc: "For personal task tracking and quick notes.",
      features: ["All three workspace tabs", "Up to 5 categories for lists", "Standard calendar events", "Basic local database integrations"],
      cta: "Start for Free",
      highlighted: false
    },
    {
      name: "Professional",
      price: "$8",
      desc: "For power creators, developers, and builders.",
      features: ["Unlimited todo categories", "Unlimited color notes & pins", "Email notification alerts triggered", "Premium dark-tech styles", "Priority queue mail delivery"],
      cta: "Upgrade to Pro",
      highlighted: true
    },
    {
      name: "Team",
      price: "$24",
      desc: "For collaborating units and workspace shares.",
      features: ["Everything in Pro", "Shared category checklists", "Team schedule calendar grids", "Dedicated server container runs", "24/7 technical assistance"],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-grid-pattern relative">
      {/* Decorative gradient lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP HEADER NAVIGATION */}
      <header className="glass-panel border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer">
            <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-gradient-lavender tracking-tight font-extrabold text-2xl font-sans">Momentum</span>
          </div>
          
          <nav className="hidden md:flex gap-6 text-sm font-semibold text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#analytics" className="hover:text-white transition-colors">Analytics</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <button 
            onClick={onGetStarted}
            className="border border-white/10 hover:border-white/20 hover:bg-white/5 bg-neutral-900/50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Soft lavender glow indicator */}
        <div className="absolute top-[-50px] right-[20%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />
        
        {/* Subtitle tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/30 border border-purple-500/20 text-purple-300 rounded-full text-xs font-bold mb-6">
          <Zap className="w-3 h-3 text-purple-400" />
          Introducing Momentum SaaS
        </div>

        {/* Large bold headline */}
        <h1 className="text-gradient-lavender text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6 font-sans">
          Streamline your thoughts, schedules, and workflows.
        </h1>

        {/* Supporting copy */}
        <p className="text-neutral-400 text-base sm:text-lg max-w-2xl leading-relaxed mb-10 font-medium">
          A premium unified hub matching high-end startups, agencies, and enterprise teams. Group task checklists, capture Google Keep-like notes, and program reminders.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button 
            onClick={onGetStarted}
            className="bg-purple-gradient bg-purple-gradient-hover text-white font-semibold text-sm px-8 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </button>
          <a 
            href="#features"
            className="border border-white/10 hover:border-white/20 bg-neutral-900/40 hover:bg-neutral-900/70 text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-all"
          >
            Explore Features
          </a>
        </div>

        {/* Floating Mockup Dashboard graphic */}
        <div className="w-full max-w-5xl relative animate-fadeIn">
          {/* Dashboard mockup border glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/15 to-transparent blur-[50px] rounded-2xl pointer-events-none" />
          <div className="glass-panel border-white/10 p-4 rounded-2xl shadow-2xl relative">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="text-[10px] text-neutral-500 font-bold ml-2">Momentum Workspace Preview</div>
            </div>
            
            {/* Visual dashboard segments mock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Collapsible todo mockup */}
              <div className="bg-[#141625] border border-white/5 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-neutral-300">skills checklist</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-950/40 text-purple-400 rounded font-bold border border-purple-500/20">4 of 8</span>
                </div>
                <div className="space-y-2 text-xs text-neutral-400">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white/10 rounded bg-white/5" /><span>js framework configurations</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white/10 rounded bg-white/5" /><span>react state machines</span></div>
                  <div className="flex items-center gap-2 text-neutral-500 line-through"><div className="w-4 h-4 border border-purple-500/30 rounded bg-purple-950/30 flex items-center justify-center text-[10px] text-purple-400">✓</div><span>html specifications</span></div>
                  <div className="flex items-center gap-2 text-neutral-500 line-through"><div className="w-4 h-4 border border-purple-500/30 rounded bg-purple-950/30 flex items-center justify-center text-[10px] text-purple-400">✓</div><span>sql schemas</span></div>
                </div>
              </div>

              {/* Keep notes mock */}
              <div className="bg-[#141625] border border-white/5 p-4 rounded-xl space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/10 rounded-full blur-sm" />
                <div className="text-[10px] text-neutral-500 font-bold">13 Jun • 15:07</div>
                <h4 className="text-xs font-bold text-white">AI startup buildathon</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">Discuss last registration date on June 14, draft prototype, and configure backend database entities.</p>
              </div>

              {/* Monthly calendar mock */}
              <div className="bg-[#141625] border border-white/5 p-4 rounded-xl space-y-2">
                <div className="text-xs font-bold text-neutral-300">calendar agenda</div>
                <div className="space-y-1.5">
                  <div className="p-1.5 bg-blue-600/10 border border-blue-500/20 rounded text-[10px] text-blue-400 font-bold truncate">09:00 - Meeting with Main Agent</div>
                  <div className="p-1.5 bg-purple-600/10 border border-purple-500/20 rounded text-[10px] text-purple-400 font-bold truncate">14:00 - Prototype Demo Sync</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES GRID SECTION */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">A complete productivity kit</h2>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm">Everything you need to focus, catalog, and coordinate your projects, built to look beautiful.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="bg-[#141625] border border-white/5 p-8 rounded-2xl hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 group">
                <div className="p-3 bg-purple-950/30 border border-purple-500/20 text-purple-400 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. STATISTICS SECTION ( Sleek Analytics Cards ) */}
      <section id="analytics" className="py-20 px-6 max-w-7xl mx-auto bg-neutral-900/10 border-y border-white/5 relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-1 space-y-4">
            <div className="text-purple-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Live Productivity Metrics
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">Quantify your execution speed.</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">Watch your completion ratios climb and scheduling conflicts dissolve with our smart dashboard.</p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {stats.map((s, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-white/5">
                <div className="text-3xl sm:text-4xl font-extrabold text-purple-400 mb-2">{s.value}</div>
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TESTIMONIALS SECTION ( Glass Cards ) */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">Loved by creators and startups</h2>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm font-medium">Read why developers, designers, and agencies choose Momentum to stream their workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "Momentum's dark theme matches my IDE perfectly. The collapsible category-based checklist is exactly how my brain structures coding tasks.",
              author: "Alex Rivers",
              role: "Fullstack Engineer"
            },
            {
              quote: "The monthly calendar grid lets me schedule client prototype checkups with alerts without leaving my quick notes workspace. Absolutely amazing design.",
              author: "Elena Vance",
              role: "Design Lead at Stripe"
            },
            {
              quote: "We replaced three different apps with Momentum. It is extremely fast, luxurious, and supports category filtering flawlessly.",
              author: "Marcus Aurel",
              role: "Founder, Chrono Labs"
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-purple-500/20 font-serif text-6xl select-none leading-none">“</div>
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />)}
                </div>
                <p className="text-neutral-300 text-xs leading-relaxed italic">"{item.quote}"</p>
              </div>
              <div className="mt-6 border-t border-white/5 pt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {item.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{item.author}</h4>
                  <span className="text-[10px] text-neutral-500 font-semibold">{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5 relative">
        <div className="absolute bottom-0 right-[15%] w-[450px] h-[450px] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">Pricing simple, fair, and transparent</h2>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm">Choose the tier that coordinates your execution speed best.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {pricing.map((tier, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col justify-between p-8 rounded-2xl transition-all duration-300 ${
                tier.highlighted 
                  ? 'bg-[#141625] border-2 border-purple-500 shadow-2xl shadow-purple-500/10 scale-[1.03] relative' 
                  : 'bg-neutral-900/40 border border-white/5'
              }`}
            >
              {tier.highlighted && (
                <span className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Popular Plan
                </span>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  <p className="text-neutral-400 text-xs mt-1">{tier.desc}</p>
                </div>
                <div className="text-4xl font-extrabold text-white">
                  {tier.price}<span className="text-neutral-500 text-xs font-semibold"> / month</span>
                </div>
                
                <ul className="space-y-3 text-xs text-neutral-300">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={onGetStarted}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all mt-8 ${
                  tier.highlighted 
                    ? 'bg-purple-gradient bg-purple-gradient-hover text-white shadow shadow-purple-500/20' 
                    : 'border border-white/10 hover:border-white/20 bg-neutral-950 text-white'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto border-t border-white/5">
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-8 text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="glass-panel border-white/5 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-neutral-200 hover:text-white transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180 text-purple-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-neutral-400 border-t border-white/5 leading-relaxed bg-neutral-950/20 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. MODERN FOOTER */}
      <footer className="border-t border-white/5 bg-[#050505] relative py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-gradient-lavender tracking-tight font-extrabold text-2xl font-sans">Momentum</span>
            </div>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs">A unified professional workspace for startups and creator teams.</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#analytics" className="hover:text-white transition-colors">Analytics</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Keep Updated</h4>
            <p className="text-neutral-500 text-xs">Join our newsletter to receive feature logs and updates.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="you@domain.com" className="w-full glass-input rounded-xl px-3 py-2 text-xs" />
              <button className="bg-purple-gradient text-white font-bold text-xs px-3.5 py-2 rounded-xl">Join</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-neutral-600 font-semibold gap-4">
          <div>© {new Date().getFullYear()} Momentum SaaS. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-neutral-400">Terms of Use</a>
            <a href="#" className="hover:text-neutral-400">Security Specs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
