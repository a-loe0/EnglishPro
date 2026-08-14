import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();

  const dashboardLink = user?.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';

  return (
    <div className="min-h-screen bg-bg-light relative overflow-hidden">
      {/* Floating decorative letters - background layer */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <span className="absolute top-[8%] left-[5%] text-[220px] font-black text-primary/[0.03] rotate-[-12deg] animate-[float_20s_ease-in-out_infinite]">L</span>
        <span className="absolute top-[50%] left-[2%] text-[140px] font-black text-accent/[0.04] rotate-[15deg] animate-[float_25s_ease-in-out_infinite_reverse]">e</span>
        <span className="absolute top-[15%] right-[8%] text-[180px] font-black text-primary/[0.025] rotate-[18deg] animate-[float_22s_ease-in-out_infinite]">a</span>
        <span className="absolute top-[65%] right-[5%] text-[160px] font-black text-accent/[0.035] rotate-[-10deg] animate-[float_18s_ease-in-out_infinite_reverse]">r</span>
        <span className="absolute bottom-[15%] left-[15%] text-[120px] font-black text-primary/[0.03] rotate-[8deg] animate-[float_24s_ease-in-out_infinite]">n</span>
        <span className="absolute top-[35%] left-[45%] text-[100px] font-black text-accent/[0.025] rotate-[-5deg] animate-[float_26s_ease-in-out_infinite_reverse]">!</span>
      </div>

      {/* Header */}
      <header className="h-[70px] bg-white/80 backdrop-blur-sm shadow-[0_2px_20px_rgba(99,102,241,0.08)] sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto h-full px-8 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
            EnglishGoPro
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to={dashboardLink}
                className="h-10 px-6 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-lg flex items-center hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-primary transition-colors px-4 py-2"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="h-10 px-6 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-lg flex items-center hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            {/* Headline */}
            <h1 className="text-[56px] leading-[1.1] font-bold text-gray-900 mb-6 animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
              Master English with{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Expert Teachers
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
              Watch video lessons from professional teachers, learn at your own pace,
              and track your progress — all in one place.
            </p>

            {/* CTA Button */}
            <div className="flex items-center justify-center animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
              <Link
                to="/register"
                className="group relative h-14 px-8 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl overflow-hidden hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </Link>
            </div>
          </div>

          {/* Hero visual - Abstract representation */}
          <div className="mt-20 max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
            <div className="relative">
              {/* Gradient glow behind */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-3xl transform scale-95" />

              {/* Main card */}
              <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(99,102,241,0.15)] p-8 border border-gray-100">
                <div className="grid grid-cols-3 gap-6">
                  {/* Video preview placeholder */}
                  <div className="col-span-2 aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="h-1 bg-white/50 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-gradient-to-r from-primary to-accent rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Lesson list placeholder */}
                  <div className="space-y-3">
                    {['Lesson 1: Greetings', 'Lesson 2: Introductions', 'Lesson 3: Daily Life', 'Lesson 4: At Work'].map((lesson, i) => (
                      <div
                        key={lesson}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          i === 0
                            ? 'bg-primary/5 border-primary/20 text-primary'
                            : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            i === 0 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium truncate">{lesson}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 relative">
        <div className="max-w-[1440px] mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-[40px] font-bold text-gray-900 mb-4">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">succeed</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Our platform combines the best tools for learning English effectively
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Video Lessons */}
            <div className="group bg-white rounded-[12px] p-8 shadow-[0_4px_20px_rgba(99,102,241,0.08)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.15)] transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Video Lessons</h3>
              <p className="text-gray-500 leading-relaxed">
                Watch high-quality video lessons from experienced English teachers. Learn at your own pace with content designed for your level.
              </p>
            </div>

            {/* Organized Courses */}
            <div className="group bg-white rounded-[12px] p-8 shadow-[0_4px_20px_rgba(99,102,241,0.08)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.15)] transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Organized Courses</h3>
              <p className="text-gray-500 leading-relaxed">
                Browse curated courses organized by topic and level. Pick up right where you left off with automatic progress saving.
              </p>
            </div>

            {/* Track Progress */}
            <div className="group bg-white rounded-[12px] p-8 shadow-[0_4px_20px_rgba(99,102,241,0.08)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.15)] transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-video-thumb to-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Track Progress</h3>
              <p className="text-gray-500 leading-relaxed">
                See your improvement over time with detailed progress reports. Stay motivated with achievements and learning streaks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="relative bg-gradient-to-r from-primary to-accent rounded-3xl p-16 text-center overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 text-[120px] font-black text-white rotate-[-15deg]">A</div>
              <div className="absolute bottom-10 right-10 text-[100px] font-black text-white rotate-[15deg]">Z</div>
              <div className="absolute top-1/2 left-1/4 text-[80px] font-black text-white rotate-[5deg]">B</div>
            </div>

            <div className="relative z-10">
              <h2 className="text-[40px] font-bold text-white mb-4">
                Ready to start your journey?
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
                Join thousands of students improving their English every day
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 h-14 px-10 bg-white text-primary font-semibold rounded-xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all hover:scale-105"
              >
                Create Free Account
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                EnglishGoPro
              </span>
              <nav className="flex items-center gap-6 text-sm text-gray-500">
                <Link to="/about" className="hover:text-primary transition-colors">About</Link>
                <Link to="/courses" className="hover:text-primary transition-colors">Courses</Link>
                <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
                <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
              </nav>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} EnglishGoPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--rotation, 0deg)); }
          50% { transform: translateY(-20px) rotate(var(--rotation, 0deg)); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
