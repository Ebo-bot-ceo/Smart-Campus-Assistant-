import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useFirestoreData } from './hooks/useFirestoreData';
import { calculateGPA, cn } from './lib/utils';
import { getAcademicSuggestions, AISuggestion } from './services/geminiService';
import { 
  LayoutDashboard, 
  Calculator, 
  TrendingUp, 
  Calendar, 
  User, 
  LogOut, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  Target,
  BarChart3,
  LineChart as LineChartIcon,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { GRADE_POINTS } from './types';
import { auth, db, doc, updateDoc, handleFirestoreError, OperationType } from './firebase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function App() {
  const { user, profile, loading: authLoading, login, logout } = useAuth();
  const { courses, deadlines, semesters, addCourse, updateCourse, deleteCourse, addDeadline, updateDeadline, deleteDeadline, addSemester } = useFirestoreData(user?.uid);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gpa' | 'predictor' | 'deadlines' | 'settings'>('dashboard');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Smart Campus Assistant</h1>
          <p className="text-slate-600 mb-8">Manage your academic life with ease. Track GPA, predict performance, and never miss a deadline.</p>
          <button 
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const currentGPA = calculateGPA(courses);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 truncate">Smart Campus</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Calculator className="w-5 h-5" />} 
            label="GPA Calculator" 
            active={activeTab === 'gpa'} 
            onClick={() => setActiveTab('gpa')} 
          />
          <NavItem 
            icon={<TrendingUp className="w-5 h-5" />} 
            label="GPA Predictor" 
            active={activeTab === 'predictor'} 
            onClick={() => setActiveTab('predictor')} 
          />
          <NavItem 
            icon={<Calendar className="w-5 h-5" />} 
            label="Deadlines" 
            active={activeTab === 'deadlines'} 
            onClick={() => setActiveTab('deadlines')} 
          />
          <NavItem 
            icon={<User className="w-5 h-5" />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Profile" 
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <Dashboard 
              key="dashboard" 
              profile={profile} 
              courses={courses} 
              deadlines={deadlines} 
              currentGPA={currentGPA}
            />
          )}
          {activeTab === 'gpa' && (
            <GPACalculator 
              key="gpa" 
              courses={courses} 
              addCourse={addCourse} 
              updateCourse={updateCourse} 
              deleteCourse={deleteCourse} 
            />
          )}
          {activeTab === 'predictor' && (
            <GPAPredictor 
              key="predictor" 
              courses={courses} 
              profile={profile}
            />
          )}
          {activeTab === 'deadlines' && (
            <DeadlineTracker 
              key="deadlines" 
              deadlines={deadlines} 
              addDeadline={addDeadline} 
              updateDeadline={updateDeadline} 
              deleteDeadline={deleteDeadline} 
            />
          )}
          {activeTab === 'settings' && (
            <Settings 
              key="settings" 
              profile={profile} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
        active 
          ? "bg-blue-50 text-blue-600" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Dashboard({ profile, courses, deadlines, currentGPA }: any) {
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const pendingDeadlines = deadlines.filter((d: any) => d.status === 'pending');
  const upcomingDeadlines = [...pendingDeadlines].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3);
  
  const hardCourses = courses.filter((c: any) => c.difficulty === 'Hard' && (!c.grade || c.grade === ''));
  const easyCourses = courses.filter((c: any) => c.difficulty === 'Easy' && (!c.grade || c.grade === ''));
  const mediumCourses = courses.filter((c: any) => c.difficulty === 'Medium' && (!c.grade || c.grade === ''));
  const highPriorityCourses = courses.filter((c: any) => 
    c.difficulty === 'Hard' && 
    c.credits >= 3 && 
    (!c.grade || c.grade === '')
  );

  const fetchAISuggestions = async () => {
    setLoadingAI(true);
    const suggestions = await getAcademicSuggestions(courses, deadlines, currentGPA, profile?.targetGPA || 3.5);
    setAiSuggestions(suggestions);
    setLoadingAI(false);
  };

  useEffect(() => {
    if (courses.length > 0) {
      fetchAISuggestions();
    }
  }, [courses.length, deadlines.length]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.displayName?.split(' ')[0]}!</h1>
        <p className="text-slate-500 text-sm">Here's what's happening with your academic life today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Current GPA" 
          value={currentGPA.toFixed(2)} 
          subValue="Based on your courses"
          icon={<Calculator className="w-6 h-6 text-blue-600" />}
          color="blue"
        />
        <StatCard 
          label="Target GPA" 
          value={profile?.targetGPA?.toFixed(2) || "4.00"} 
          subValue="Your academic goal"
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          color="emerald"
        />
        <StatCard 
          label="Deadlines" 
          value={pendingDeadlines.length.toString()} 
          subValue="Tasks to complete"
          icon={<Calendar className="w-6 h-6 text-orange-600" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Deadlines</h2>
            <button className="text-blue-600 text-sm font-medium hover:underline">View all</button>
          </div>
          <div className="space-y-4">
            {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((deadline: any) => (
              <div key={deadline.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  deadline.type === 'exam' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                )}>
                  {deadline.type === 'exam' ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{deadline.title}</p>
                  <p className="text-xs text-slate-500">{format(new Date(deadline.dueDate), 'PPP')}</p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                    isPast(new Date(deadline.dueDate)) ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {isToday(new Date(deadline.dueDate)) ? 'Today' : isTomorrow(new Date(deadline.dueDate)) ? 'Tomorrow' : format(new Date(deadline.dueDate), 'MMM d')}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-500 py-8">No upcoming deadlines. Great job!</p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Academic Suggestions
              <Sparkles className="w-4 h-4 text-blue-600" />
            </h2>
            <button 
              onClick={fetchAISuggestions}
              disabled={loadingAI}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh AI Suggestions"
            >
              <RefreshCw className={cn("w-4 h-4 text-slate-500", loadingAI && "animate-spin")} />
            </button>
          </div>
          <div className="space-y-4">
            {loadingAI && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium italic">Gemini is analyzing your performance...</p>
              </div>
            )}

            {!loadingAI && aiSuggestions.length > 0 && aiSuggestions.map((suggestion, index) => (
              <SuggestionCard 
                key={`ai-${index}`}
                type={suggestion.type}
                title={suggestion.title}
                description={suggestion.description}
              />
            ))}

            {!loadingAI && aiSuggestions.length === 0 && (
              <>
                {highPriorityCourses.length > 0 && (
                  <SuggestionCard 
                    type="warning"
                    title="High Priority Courses"
                    description={`Courses like ${highPriorityCourses[0].courseName} are both difficult and high-credit. These will have the biggest impact on your GPA.`}
                  />
                )}
                {hardCourses.length > 0 && (
                  <SuggestionCard 
                    type="warning"
                    title="Focus on Hard Courses"
                    description={`You have ${hardCourses.length} course(s) marked as 'Hard' that are still in progress. Allocate more study time to these subjects.`}
                  />
                )}
                {hardCourses.length > 2 && (
                  <SuggestionCard 
                    type="warning"
                    title="Heavy Workload Detected"
                    description="You are taking many difficult courses. Ensure you are managing your time effectively and seeking help if needed."
                  />
                )}
                {easyCourses.length > 0 && currentGPA < 3.0 && (
                  <SuggestionCard 
                    type="info"
                    title="Secure Easy Wins"
                    description={`You have ${easyCourses.length} 'Easy' course(s). Focus on getting top grades in these to boost your GPA quickly.`}
                  />
                )}
                {currentGPA < 2.5 && (
                  <SuggestionCard 
                    type="warning"
                    title="Improve GPA"
                    description="Your current GPA is below 2.5. Focus on your high-credit courses to boost your score efficiently."
                  />
                )}
                {pendingDeadlines.length > 5 && (
                  <SuggestionCard 
                    type="info"
                    title="Task Overload"
                    description="You have many pending deadlines. Break them down into smaller tasks to stay organized."
                  />
                )}
                {currentGPA >= 3.5 && (
                  <SuggestionCard 
                    type="success"
                    title="Excellent Performance"
                    description="Your GPA is outstanding! Keep maintaining this consistency for your target goals."
                  />
                )}
              </>
            )}
            
            <SuggestionCard 
              type="info"
              title="Predict Your Future"
              description="Use the GPA Predictor to see what grades you need in your current courses to reach your target."
            />
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, subValue, icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 border-blue-100",
    emerald: "bg-emerald-50 border-emerald-100",
    orange: "bg-orange-50 border-orange-100"
  };

  return (
    <div className={cn("p-6 rounded-2xl border shadow-sm", colors[color])}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white rounded-xl shadow-sm">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        <p className="text-slate-400 text-xs mt-1">{subValue}</p>
      </div>
    </div>
  );
}

function SuggestionCard({ type, title, description }: any) {
  const styles: any = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800"
  };

  return (
    <div className={cn("p-4 rounded-xl border flex gap-3", styles[type])}>
      <AlertCircle className="w-5 h-5 shrink-0" />
      <div>
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs opacity-80">{description}</p>
      </div>
    </div>
  );
}

function GPACalculator({ courses, addCourse, updateCourse, deleteCourse }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [newCourse, setNewCourse] = useState({ courseName: '', credits: 3, grade: '', courseCode: '', difficulty: 'Medium' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.courseName) return;
    await addCourse({ ...newCourse, userId: auth.currentUser?.uid });
    setNewCourse({ courseName: '', credits: 3, grade: '', courseCode: '', difficulty: 'Medium' });
    setIsAdding(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editingCourse.courseName) return;
    const { id, ...data } = editingCourse;
    await updateCourse(id, data);
    setEditingCourse(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GPA Calculator</h1>
          <p className="text-slate-500 text-sm">Manage your courses and track your academic performance.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Course
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Credits</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Points</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.length > 0 ? courses.map((course: any) => (
              <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{course.courseName}</p>
                  <p className="text-xs text-slate-500">{course.courseCode || 'No Code'}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                    course.difficulty === 'Hard' ? "bg-red-100 text-red-700" : 
                    course.difficulty === 'Medium' ? "bg-amber-100 text-amber-700" : 
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {course.difficulty || 'Medium'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">{course.credits}</td>
                <td className="px-6 py-4">
                  <select 
                    value={course.grade} 
                    onChange={(e) => updateCourse(course.id, { grade: e.target.value })}
                    className="bg-slate-100 border-none rounded-lg text-sm font-bold px-3 py-1 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-</option>
                    {Object.keys(GRADE_POINTS).filter(k => k !== '').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">
                  {course.grade ? (GRADE_POINTS[course.grade] * course.credits).toFixed(1) : '0.0'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setEditingCourse(course)}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteCourse(course.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No courses added yet. Start by adding your first course!
                </td>
              </tr>
            )}
          </tbody>
          {courses.length > 0 && (
            <tfoot className="bg-slate-50 font-bold">
              <tr>
                <td className="px-6 py-4 text-slate-900">Total</td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-slate-900">
                  {courses.reduce((acc: number, c: any) => acc + c.credits, 0)}
                </td>
                <td className="px-6 py-4 text-blue-600">
                  {calculateGPA(courses).toFixed(2)} (GPA)
                </td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <AnimatePresence>
        {(isAdding || editingCourse) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                {isAdding ? 'Add New Course' : 'Edit Course'}
              </h2>
              <form onSubmit={isAdding ? handleAdd : handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Course Name</label>
                    <input 
                      type="text" 
                      required
                      value={isAdding ? newCourse.courseName : editingCourse.courseName}
                      onChange={e => isAdding 
                        ? setNewCourse({...newCourse, courseName: e.target.value})
                        : setEditingCourse({...editingCourse, courseName: e.target.value})
                      }
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. Introduction to Psychology"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Course Code</label>
                    <input 
                      type="text" 
                      value={isAdding ? newCourse.courseCode : editingCourse.courseCode}
                      onChange={e => isAdding 
                        ? setNewCourse({...newCourse, courseCode: e.target.value})
                        : setEditingCourse({...editingCourse, courseCode: e.target.value})
                      }
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. PSY101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Credits</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      max="10"
                      value={isAdding ? newCourse.credits : editingCourse.credits}
                      onChange={e => isAdding 
                        ? setNewCourse({...newCourse, credits: parseInt(e.target.value)})
                        : setEditingCourse({...editingCourse, credits: parseInt(e.target.value)})
                      }
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                    <select 
                      value={isAdding ? newCourse.difficulty : editingCourse.difficulty}
                      onChange={e => isAdding 
                        ? setNewCourse({...newCourse, difficulty: e.target.value})
                        : setEditingCourse({...editingCourse, difficulty: e.target.value})
                      }
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  {!isAdding && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                      <select 
                        value={editingCourse.grade}
                        onChange={e => setEditingCourse({...editingCourse, grade: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">-</option>
                        {Object.keys(GRADE_POINTS).filter(k => k !== '').map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingCourse(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    {isAdding ? 'Add Course' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function GPAPredictor({ courses, profile }: any) {
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const currentGPA = calculateGPA(courses);
  const totalCredits = courses.reduce((acc: number, c: any) => acc + c.credits, 0);
  const [targetGPA, setTargetGPA] = useState(profile?.targetGPA || 3.5);
  const [futureSemesters, setFutureSemesters] = useState([
    { 
      id: 1, 
      name: 'Next Semester', 
      credits: 15, 
      expectedGPA: 3.5,
      difficultyBreakdown: { Easy: 6, Medium: 6, Hard: 3 }
    }
  ]);

  const totalFutureCredits = futureSemesters.reduce((acc, s) => acc + s.credits, 0);
  const currentPoints = courses.reduce((acc: number, c: any) => acc + (GRADE_POINTS[c.grade] || 0) * c.credits, 0);
  const requiredGPA = totalFutureCredits > 0 
    ? ((targetGPA * (totalCredits + totalFutureCredits)) - currentPoints) / totalFutureCredits 
    : 0;

  const addSemester = () => {
    setFutureSemesters([...futureSemesters, { 
      id: Date.now(), 
      name: `Semester ${futureSemesters.length + 1}`, 
      credits: 15,
      expectedGPA: 3.5,
      difficultyBreakdown: { Easy: 5, Medium: 5, Hard: 5 }
    }]);
  };

  const removeSemester = (id: number) => {
    if (futureSemesters.length > 1) {
      setFutureSemesters(futureSemesters.filter(s => s.id !== id));
    }
  };

  const updateSemester = (id: number, field: string, value: any) => {
    setFutureSemesters(futureSemesters.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updateDifficulty = (id: number, diff: string, value: number) => {
    setFutureSemesters(futureSemesters.map(s => {
      if (s.id === id) {
        const newBreakdown = { ...s.difficultyBreakdown, [diff]: value };
        const newTotal = Object.values(newBreakdown).reduce((a: number, b: any) => a + (b as number), 0);
        return { ...s, difficultyBreakdown: newBreakdown, credits: newTotal };
      }
      return s;
    }));
  };

  // Calculate trend data for chart
  const trendData = (() => {
    const data = [{ name: 'Current', gpa: currentGPA, credits: totalCredits }];
    let cumulativePoints = currentPoints;
    let cumulativeCredits = totalCredits;

    futureSemesters.forEach((s, idx) => {
      cumulativePoints += s.expectedGPA * s.credits;
      cumulativeCredits += s.credits;
      data.push({
        name: `Sem ${idx + 1}`,
        gpa: parseFloat((cumulativePoints / cumulativeCredits).toFixed(2)),
        credits: cumulativeCredits
      });
    });
    return data;
  })();

  const fetchAIAdvice = async () => {
    if (totalFutureCredits === 0) return;
    setLoadingAI(true);
    try {
      const prompt = `As an Academic Advisor, analyze this student's situation and provide a brief strategic advice (max 150 words) on how to reach their target GPA.
      Current GPA: ${currentGPA.toFixed(2)}
      Target GPA: ${targetGPA.toFixed(2)}
      Total Future Credits: ${totalFutureCredits} across ${futureSemesters.length} semesters.
      Required GPA in future credits: ${requiredGPA.toFixed(2)}
      
      Future Workload Breakdown:
      ${futureSemesters.map((s, i) => `Semester ${i+1}: ${s.difficultyBreakdown.Easy} Easy, ${s.difficultyBreakdown.Medium} Medium, ${s.difficultyBreakdown.Hard} Hard credits.`).join('\n')}
      
      Current Courses: ${courses.map(c => `${c.courseName} (${c.difficulty})`).join(', ')}
      
      Please suggest specific grades for Easy vs Hard courses to reach the target efficiently.`;

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setAiAdvice(response.text || "No advice available at the moment.");
    } catch (error) {
      console.error("Error fetching AI advice:", error);
      setAiAdvice("Failed to fetch AI advice. Please try again later.");
    }
    setLoadingAI(false);
  };

  useEffect(() => {
    if (requiredGPA > 0 && requiredGPA <= 4) {
      fetchAIAdvice();
    }
  }, [targetGPA, totalFutureCredits]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pb-12"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GPA Predictor</h1>
          <p className="text-slate-500 text-sm">Forecast your academic future with granular workload planning.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
          <Target className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-bold text-blue-700">Target: {targetGPA.toFixed(2)}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Prediction Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target GPA</label>
                <input 
                  type="range" 
                  min="2.0" 
                  max="4.0" 
                  step="0.01"
                  value={targetGPA}
                  onChange={e => setTargetGPA(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500 font-bold">{targetGPA.toFixed(2)}</span>
                  <span className="text-xs text-slate-500">Goal</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">Future Semesters</label>
                  <button 
                    onClick={addSemester}
                    className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Semester
                  </button>
                </div>
                <div className="space-y-4">
                  {futureSemesters.map((s, idx) => (
                    <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester {idx + 1}</span>
                        {futureSemesters.length > 1 && (
                          <button 
                            onClick={() => removeSemester(s.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Credit Breakdown by Difficulty</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[9px] text-emerald-600 font-bold uppercase block mb-1">Easy</label>
                            <input 
                              type="number" 
                              min="0"
                              value={s.difficultyBreakdown.Easy}
                              onChange={e => updateDifficulty(s.id, 'Easy', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-amber-600 font-bold uppercase block mb-1">Medium</label>
                            <input 
                              type="number" 
                              min="0"
                              value={s.difficultyBreakdown.Medium}
                              onChange={e => updateDifficulty(s.id, 'Medium', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-red-600 font-bold uppercase block mb-1">Hard</label>
                            <input 
                              type="number" 
                              min="0"
                              value={s.difficultyBreakdown.Hard}
                              onChange={e => updateDifficulty(s.id, 'Hard', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[10px] text-slate-500 font-bold">Total: {s.credits} Credits</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Exp. GPA</span>
                            <input 
                              type="number" 
                              min="0"
                              max="4"
                              step="0.1"
                              value={s.expectedGPA}
                              onChange={e => updateSemester(s.id, 'expectedGPA', parseFloat(e.target.value) || 0)}
                              className="w-12 px-1 py-0.5 text-xs rounded border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Total Future Credits</span>
                    <span className="font-bold text-slate-900">{totalFutureCredits}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(
            "rounded-2xl p-6 text-white shadow-xl transition-all",
            requiredGPA > 4 ? "bg-red-600 shadow-red-200" : "bg-blue-600 shadow-blue-200"
          )}>
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-80 mb-2">Required Average</h3>
            <p className="text-4xl font-bold mb-2">
              {requiredGPA > 4 ? "N/A" : requiredGPA < 0 ? "0.00" : requiredGPA.toFixed(2)}
            </p>
            <p className="text-xs opacity-80 leading-relaxed">
              {requiredGPA > 4 
                ? "Your target is mathematically impossible with the current credits. Try increasing future credits or lowering the target." 
                : `To reach ${targetGPA.toFixed(2)}, you need an average of ${requiredGPA.toFixed(2)} across your next ${totalFutureCredits} credits.`}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              GPA Projection Trend
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 4]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gpa" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorGpa)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 leading-relaxed">
                This chart shows your cumulative GPA progression based on your **Expected GPA** for each future semester. Adjust the workload breakdown to see how it impacts your goals.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Detailed Scenarios</h2>
            <p className="text-slate-500 text-sm mb-6">How your CGPA changes based on future performance across {totalFutureCredits} credits.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ScenarioRow 
                label="Target Achieved" 
                description={`Maintain ${requiredGPA.toFixed(2)} average`}
                gpa={targetGPA.toFixed(2)}
                color="blue"
                disabled={requiredGPA > 4}
              />
              <ScenarioRow 
                label="Perfect Performance" 
                description="Straight A's (4.0)"
                gpa={((currentPoints + (4.0 * totalFutureCredits)) / (totalCredits + totalFutureCredits)).toFixed(2)}
                color="emerald"
              />
              <ScenarioRow 
                label="Solid Performance" 
                description="Straight B's (3.0)"
                gpa={((currentPoints + (3.0 * totalFutureCredits)) / (totalCredits + totalFutureCredits)).toFixed(2)}
                color="amber"
              />
              <ScenarioRow 
                label="Minimum Passing" 
                description="Straight C's (2.0)"
                gpa={((currentPoints + (2.0 * totalFutureCredits)) / (totalCredits + totalFutureCredits)).toFixed(2)}
                color="slate"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                AI Strategic Advice
                <Sparkles className="w-4 h-4 text-blue-600" />
              </h2>
              <button 
                onClick={fetchAIAdvice}
                disabled={loadingAI || totalFutureCredits === 0}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-4 h-4 text-slate-500", loadingAI && "animate-spin")} />
              </button>
            </div>
            {loadingAI ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium italic">Gemini is strategizing based on workload difficulty...</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-sm text-blue-900 leading-relaxed italic">"{aiAdvice || 'Adjust your target or future credits to get strategic advice.'}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ScenarioRow({ label, description, gpa, color, disabled }: { label: string, description: string, gpa: string, color: string, disabled?: boolean }) {
  const colorClasses: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    slate: "text-slate-600 bg-slate-50 border-slate-100",
  };

  if (disabled) return null;

  return (
    <div className={cn("p-4 rounded-xl border transition-all", colorClasses[color])}>
      <div className="flex justify-between items-start mb-1">
        <span className="font-bold text-sm">{label}</span>
        <span className="text-xl font-black">{gpa}</span>
      </div>
      <p className="text-[10px] opacity-70 font-medium uppercase tracking-wider">{description}</p>
    </div>
  );
}

function DeadlineTracker({ deadlines, addDeadline, updateDeadline, deleteDeadline }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [newDeadline, setNewDeadline] = useState({ title: '', type: 'assignment', dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"), status: 'pending' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeadline.title) return;
    await addDeadline({ ...newDeadline, userId: auth.currentUser?.uid });
    setNewDeadline({ title: '', type: 'assignment', dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"), status: 'pending' });
    setIsAdding(false);
  };

  const sortedDeadlines = [...deadlines].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deadline Tracker</h1>
          <p className="text-slate-500 text-sm">Stay on top of your assignments, exams, and projects.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {sortedDeadlines.length > 0 ? sortedDeadlines.map((deadline: any) => (
          <div 
            key={deadline.id} 
            className={cn(
              "bg-white rounded-2xl border p-4 flex items-center gap-4 transition-all shadow-sm",
              deadline.status === 'completed' ? "opacity-60 border-slate-100" : "border-slate-200 hover:border-blue-300"
            )}
          >
            <button 
              onClick={() => updateDeadline(deadline.id, { status: deadline.status === 'completed' ? 'pending' : 'completed' })}
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                deadline.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-blue-500"
              )}
            >
              {deadline.status === 'completed' && <CheckCircle className="w-4 h-4" />}
            </button>
            <div className="flex-1">
              <h3 className={cn("font-bold text-slate-900", deadline.status === 'completed' && "line-through text-slate-400")}>
                {deadline.title}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  deadline.type === 'exam' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                )}>
                  {deadline.type}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(deadline.dueDate), 'PPP p')}
                </span>
              </div>
            </div>
            <button 
              onClick={() => deleteDeadline(deadline.id)}
              className="text-slate-400 hover:text-red-600 transition-colors p-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No deadlines tracked yet. Add your first assignment or exam!</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Task</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                  <input 
                    type="text" 
                    required
                    value={newDeadline.title}
                    onChange={e => setNewDeadline({...newDeadline, title: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. Psychology Final Exam"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select 
                      value={newDeadline.type}
                      onChange={e => setNewDeadline({...newDeadline, type: e.target.value as any})}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                      <option value="project">Project</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={newDeadline.dueDate.slice(0, 16)}
                      onChange={e => setNewDeadline({...newDeadline, dueDate: new Date(e.target.value).toISOString()})}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Settings({ profile }: any) {
  const [targetGPA, setTargetGPA] = useState(profile?.targetGPA || 3.5);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), { targetGPA });
      alert('Settings saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
    setIsSaving(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl space-y-8"
    >
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your profile and academic preferences.</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Profile Information</h2>
          <div className="flex items-center gap-6">
            <img 
              src={`https://ui-avatars.com/api/?name=${profile?.displayName}&size=128`} 
              alt="Avatar" 
              className="w-20 h-20 rounded-2xl shadow-md"
            />
            <div>
              <p className="text-xl font-bold text-slate-900">{profile?.displayName}</p>
              <p className="text-slate-500">{profile?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">Student Account</span>
            </div>
          </div>
        </section>

        <hr className="border-slate-100" />

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Academic Goals</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target GPA (0.0 - 4.0)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                max="4"
                value={targetGPA}
                onChange={e => setTargetGPA(parseFloat(e.target.value))}
                className="w-full max-w-xs px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <p className="text-xs text-slate-400 mt-2">This goal is used in your dashboard and predictor calculations.</p>
            </div>
          </div>
        </section>

        <div className="pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
