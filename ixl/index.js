import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ChevronRight, 
  Trophy, 
  Award, 
  CheckCircle, 
  XCircle, 
  Menu, 
  X,
  PlayCircle,
  BookOpen
} from 'lucide-react';

/**
 * DATA MOCK
 * In a real Next.js app, this would come from a database (MongoDB/Postgres)
 * accessed via API routes (pages/api/skills) or Server Actions.
 */

const CURRICULUM = {
  "Math": {
    "K": {
      title: "Kindergarten",
      skills: [
        { id: "math-k-1", code: "A.1", name: "Count to 10", category: "Counting" },
        { id: "math-k-2", code: "B.4", name: "Compare numbers", category: "Comparison" },
        { id: "math-k-3", code: "C.2", name: "Add with pictures - sums up to 5", category: "Addition" }
      ]
    },
    "4": {
      title: "Fourth Grade",
      skills: [
        { id: "math-4-1", code: "F.1", name: "Prime and composite numbers", category: "Number Theory" },
        { id: "math-4-2", code: "P.3", name: "Equivalent fractions", category: "Fractions" },
        { id: "math-4-3", code: "W.1", name: "Acute, right, obtuse, and straight angles", category: "Geometry" }
      ]
    }
  },
  "Language Arts": {
    "2": {
      title: "Second Grade",
      skills: [
        { id: "la-2-1", code: "D.1", name: "Identify the subject of a sentence", category: "Grammar" },
        { id: "la-2-2", code: "L.4", name: "Use context to identify the meaning of a word", category: "Vocabulary" }
      ]
    }
  }
};

const SKILL_DATA = {
  "math-4-3": { 
    title: "Acute, right, obtuse, and straight angles",
    grade: "4",
    subject: "Math",
    questions: [
      {
        id: 1,
        type: "visual-choice",
        question: "Which type of angle is shown?",
        visual: "angle-90", 
        options: ["Acute", "Right", "Obtuse", "Straight"],
        answer: "Right",
        explanation: "A right angle forms a square corner and measures exactly 90 degrees. The angle shown forms a perfect 'L' shape, so it is a right angle."
      },
      {
        id: 2,
        type: "visual-choice",
        question: "Is this angle acute, right, obtuse, or straight?",
        visual: "angle-120",
        options: ["Acute", "Right", "Obtuse", "Straight"],
        answer: "Obtuse",
        explanation: "An obtuse angle is greater than a right angle (90°) but less than a straight angle (180°). This angle is wider than a square corner, but not a flat line, so it is obtuse."
      },
      {
        id: 3,
        type: "text-only",
        question: "An angle measures 35°. What type of angle is it?",
        options: ["Acute", "Right", "Obtuse", "Straight"],
        answer: "Acute",
        explanation: "An acute angle measures less than 90°. Since 35 is less than 90, this is an acute angle."
      }
    ]
  },
  "math-k-1": { 
    title: "Count to 10",
    grade: "K",
    subject: "Math",
    questions: [
      {
        id: 101,
        type: "visual-count",
        question: "How many red dots are there?",
        visual: "dots-3",
        options: ["2", "3", "4", "5"],
        answer: "3",
        explanation: "Count the dots one by one: 1, 2, 3. There are 3 dots."
      },
      {
        id: 102,
        type: "sequence",
        question: "Which number comes next? 1, 2, 3, __",
        options: ["4", "5", "2", "6"],
        answer: "4",
        explanation: "When we count, the number after 3 is 4."
      }
    ]
  }
};

// --- COMPONENTS ---

const Header = ({ onNavigate, currentView }) => (
  <header className="bg-white border-b border-gray-200 sticky top-0 z-50 font-sans">
    {/* Brand Strip */}
    <div className="h-1.5 w-full bg-gradient-to-r from-[#009d4f] to-[#1c80c5]"></div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        {/* Logo */}
        <div 
          onClick={() => onNavigate('home')}
          className="cursor-pointer flex items-center group"
        >
          <div className="bg-[#0070c0] text-white font-bold text-2xl px-4 py-1 rounded-sm shadow-sm group-hover:bg-[#005ea3] transition-colors">
            IXL
          </div>
        </div>

        {/* Navigation (Desktop) */}
        <nav className="hidden md:flex space-x-1 text-sm font-medium text-gray-600">
          {['Learning', 'Diagnostic', 'Analytics'].map((item) => (
            <button 
              key={item}
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded hover:text-[#0070c0] hover:bg-blue-50 transition-colors ${currentView === 'home' && item === 'Learning' ? 'text-[#0070c0] bg-blue-50' : ''}`}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      {/* Search & User */}
      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex items-center bg-white border border-gray-300 rounded-full px-3 py-1.5 w-64 focus-within:border-[#0070c0] focus-within:ring-1 focus-within:ring-[#0070c0] transition-all">
          <Search size={16} className="text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search topics and skills" 
            className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-500 text-gray-700"
          />
        </div>
        <div className="text-sm font-semibold text-[#0070c0] hidden sm:block border-l border-gray-200 pl-4">
          Welcome, Student!
        </div>
        <Menu className="md:hidden text-gray-600 cursor-pointer" />
      </div>
    </div>

    {/* Sub-navigation (Learning Subjects) */}
    {currentView === 'home' && (
      <div className="bg-[#1c80c5] text-white text-sm shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto no-scrollbar">
          {['Math', 'Language arts', 'Science', 'Social studies', 'Spanish'].map((subj) => (
            <button 
              key={subj}
              className="px-5 py-2.5 hover:bg-[#156a9e] font-medium transition-colors border-r border-[#3da0dd] last:border-none whitespace-nowrap"
            >
              {subj}
            </button>
          ))}
        </div>
      </div>
    )}
  </header>
);

const SkillDirectory = ({ onSelectSkill }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar: Grades */}
        <div className="w-full md:w-48 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-700 mb-4 px-2">Grades</h2>
          <div className="flex flex-row md:flex-col flex-wrap gap-2">
            {['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((grade) => (
              <button 
                key={grade}
                className={`w-10 h-10 md:w-full md:h-auto md:py-2 md:px-4 md:text-left rounded text-sm font-medium transition-colors flex items-center ${
                  grade === '4' 
                    ? 'bg-[#dcfce7] text-[#166534] border border-[#166534] shadow-sm' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <span className="md:hidden">{grade}</span>
                <span className="hidden md:inline flex-1">
                   {grade === 'K' ? 'Kindergarten' : grade === 'PK' ? 'Pre-K' : `Grade ${grade}`}
                </span>
                {grade === '4' && <ChevronRight size={14} className="hidden md:block ml-2" />}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Skills */}
        <div className="flex-1">
          <div className="mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Fourth grade math</h1>
            <p className="text-gray-600 leading-relaxed">
              Here is a list of all of the math skills students learn in fourth grade! 
              These skills are organized into categories, and you can move your mouse over any skill name to preview the skill. 
              To start practicing, just click on any link.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {CURRICULUM['Math']['4'].skills.map((skill) => (
              <div key={skill.id} className="break-inside-avoid">
                <h3 className="font-bold text-[#1c80c5] text-lg mb-3 flex items-center">
                  {skill.category}
                </h3>
                <ul className="space-y-3">
                  <li className="group flex items-start">
                    <span className="w-10 text-sm font-bold text-gray-400 group-hover:text-[#009d4f] pt-0.5 transition-colors">
                      {skill.code}
                    </span>
                    <button 
                      onClick={() => onSelectSkill(skill.id)}
                      className="text-sm text-gray-700 hover:text-[#009d4f] hover:underline text-left font-medium transition-colors"
                    >
                      {skill.name}
                    </button>
                  </li>
                </ul>
              </div>
            ))}
            
            {/* Filler Content to simulate full page */}
            <div className="opacity-60 pointer-events-none select-none">
               <h3 className="font-bold text-[#1c80c5] text-lg mb-3">Multiplication</h3>
               <ul className="space-y-3">
                  <li className="flex items-start"><span className="w-10 text-sm font-bold text-gray-400">D.1</span><span className="text-sm text-gray-700">Multiplication facts to 12</span></li>
                  <li className="flex items-start"><span className="w-10 text-sm font-bold text-gray-400">D.2</span><span className="text-sm text-gray-700">Missing factors</span></li>
                  <li className="flex items-start"><span className="w-10 text-sm font-bold text-gray-400">D.3</span><span className="text-sm text-gray-700">Compare numbers using multiplication</span></li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PracticeArena = ({ skillId, onExit }) => {
  const [skill, setSkill] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [status, setStatus] = useState('answering'); // 'answering', 'correct', 'incorrect'
  const [smartScore, setSmartScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Simulate data fetch
    const data = SKILL_DATA[skillId] || SKILL_DATA['math-4-3'];
    setSkill(data);
    setSmartScore(0);
    setQuestionsAnswered(0);
    setTimer(0);
  }, [skillId]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (!selectedOption) return;

    const currentQ = skill.questions[currentQIndex % skill.questions.length];
    const isCorrect = selectedOption === currentQ.answer;

    if (isCorrect) {
      setStatus('correct');
      // SmartScore Algorithm Simulation
      let increment = 10;
      if (smartScore >= 90) increment = 1;
      else if (smartScore >= 80) increment = 2;
      else if (smartScore >= 70) increment = 4;
      
      const newScore = Math.min(100, smartScore + increment);
      setSmartScore(newScore);
      setQuestionsAnswered(qa => qa + 1);
      
      // Delay for feedback
      setTimeout(() => {
        setStatus('answering');
        setSelectedOption(null);
        setCurrentQIndex(i => i + 1);
      }, 1200);
    } else {
      setStatus('incorrect');
      setIsPaused(true); // Pause timer on error
      // Penalty
      setSmartScore(Math.max(0, smartScore - 5));
      setQuestionsAnswered(qa => qa + 1);
    }
  };

  const handleGotIt = () => {
    setStatus('answering');
    setSelectedOption(null);
    setCurrentQIndex(i => i + 1);
    setIsPaused(false); // Resume timer
  };

  if (!skill) return <div className="p-20 text-center text-gray-500">Loading practice session...</div>;

  const currentQuestion = skill.questions[currentQIndex % skill.questions.length];
  const isChallengeZone = smartScore >= 90;
  const isMastered = smartScore === 100;

  // Renders different types of questions visually
  const renderVisual = (visualId) => {
    if (visualId === 'angle-90') {
      return (
        <div className="w-48 h-48 relative mb-4 mx-auto">
          <div className="absolute bottom-0 left-1/2 w-[2px] h-32 bg-black -translate-x-1/2"></div>
          <div className="absolute bottom-0 left-1/2 w-32 h-[2px] bg-black"></div>
          <div className="absolute bottom-0 left-1/2 w-6 h-6 border-t-2 border-r-2 border-black"></div>
        </div>
      );
    }
    if (visualId === 'angle-120') {
      return (
         <svg width="240" height="140" className="mb-4 mx-auto">
            {/* Base line */}
            <line x1="120" y1="120" x2="220" y2="120" stroke="black" strokeWidth="3" />
            {/* Angled line (~120 deg) */}
            <line x1="120" y1="120" x2="50" y2="40" stroke="black" strokeWidth="3" />
            {/* Arc */}
            <path d="M 100,95 Q 120,80 140,120" fill="none" stroke="black" strokeWidth="1" strokeDasharray="4" />
         </svg>
      );
    }
    if (visualId === 'dots-3') {
      return (
        <div className="flex gap-4 mb-6 justify-center">
           {[1,2,3].map(i => (
             <div key={i} className="w-16 h-16 rounded-full bg-[#ef4444] shadow-[0_4px_0_#b91c1c] border-2 border-[#b91c1c]"></div>
           ))}
        </div>
      );
    }
    return null;
  };

  if (isMastered) {
    return (
      <div className="min-h-screen bg-[#f3f9fc] flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="inline-block p-6 bg-yellow-100 rounded-full mb-4">
            <Trophy size={80} className="text-yellow-600" />
          </div>
          <h1 className="text-4xl font-bold text-[#0070c0]">Skill Mastered!</h1>
          <p className="text-xl text-gray-600">You achieved a SmartScore of 100.</p>
          <div className="flex justify-center space-x-4 pt-4">
            <button onClick={onExit} className="bg-[#009d4f] text-white px-6 py-3 rounded font-bold shadow-lg hover:bg-[#008a45] transition">
              Keep exploring
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f9fc] font-sans">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2 text-sm overflow-hidden">
          <button onClick={onExit} className="text-gray-500 hover:text-[#0070c0] font-medium">
            {skill.grade === 'K' ? 'Kindergarten' : `Grade ${skill.grade}`}
          </button>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-semibold text-gray-800 truncate max-w-xs md:max-w-none">{skill.title}</span>
        </div>
        <div className="hidden md:flex items-center space-x-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <button className="flex items-center space-x-1 hover:text-[#0070c0]">
            <BookOpen size={14} /> <span>Learn with an example</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Question Area */}
        <div className="lg:col-span-9">
          {status !== 'incorrect' ? (
            // ACTIVE QUESTION CARD
            <div className="bg-white rounded-lg shadow-sm border-2 border-transparent relative overflow-hidden min-h-[500px] flex flex-col">
              
              {/* Correct Overlay Animation */}
              {status === 'correct' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 animate-in zoom-in duration-300">
                  <div className="bg-[#ffac00] text-white px-10 py-6 rounded-xl shadow-2xl flex flex-col items-center transform scale-110">
                    <span className="font-bold text-3xl italic mb-2 font-serif">Excellent!</span>
                    <CheckCircle size={64} strokeWidth={3} />
                  </div>
                </div>
              )}

              <div className="p-8 flex-1 flex flex-col">
                <h2 className="text-xl md:text-2xl text-gray-800 font-medium mb-8 leading-snug">
                  {currentQuestion.question}
                </h2>

                <div className="flex-1 flex flex-col justify-center items-center mb-8">
                  {renderVisual(currentQuestion.visual)}
                </div>

                {/* Answer Options */}
                <div className="space-y-3 max-w-lg mx-auto w-full">
                  {currentQuestion.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedOption(opt)}
                      className={`w-full text-left px-5 py-4 rounded-md border-2 transition-all duration-200 flex items-center group
                        ${selectedOption === opt 
                          ? 'border-[#0070c0] bg-[#eef7fc] shadow-md scale-[1.01]' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className={`w-6 h-6 rounded border flex items-center justify-center mr-4 transition-colors
                        ${selectedOption === opt ? 'bg-[#0070c0] border-[#0070c0]' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                        {selectedOption === opt && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                      <span className="text-lg text-gray-700 font-medium">{opt}</span>
                    </button>
                  ))}
                </div>

                {/* Submit */}
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedOption}
                    className={`px-10 py-3 rounded font-bold text-white text-lg shadow-sm transition-all active:scale-95
                      ${selectedOption 
                        ? 'bg-[#009d4f] hover:bg-[#008a45] hover:shadow-md' 
                        : 'bg-gray-300 cursor-not-allowed'}`}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // INCORRECT EXPLANATION VIEW
            <div className="bg-white rounded-lg shadow-sm border-t-[6px] border-[#e03e1f] animate-in slide-in-from-bottom-4 duration-300">
               <div className="p-6 border-b border-gray-100 bg-[#fdf2f0]">
                  <h3 className="text-[#e03e1f] font-bold text-xl mb-2 flex items-center">
                    <XCircle className="mr-2" strokeWidth={3} /> Sorry, incorrect...
                  </h3>
                  <p className="text-gray-700 font-medium text-lg">The correct answer is: <span className="font-bold">{currentQuestion.answer}</span></p>
               </div>
               
               <div className="p-8">
                 <h4 className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-wider border-b border-gray-200 pb-2">Explanation</h4>
                 
                 <div className="bg-[#f3f9fc] p-6 rounded-lg border-l-4 border-[#1c80c5] mb-8">
                    <p className="text-gray-500 text-sm mb-2 uppercase tracking-wide font-bold">You answered:</p>
                    <div className="flex items-center text-gray-400 line-through text-lg">
                      {selectedOption}
                    </div>
                 </div>

                 <div className="prose prose-blue text-gray-800 max-w-none">
                    <p className="mb-4 text-lg leading-relaxed">{currentQuestion.explanation}</p>
                    <div className="bg-gray-50 p-4 rounded flex justify-center opacity-75">
                      {renderVisual(currentQuestion.visual)}
                    </div>
                 </div>

                 <div className="mt-10 flex justify-center">
                    <button 
                      onClick={handleGotIt}
                      className="bg-[#0070c0] hover:bg-[#005ea3] text-white px-10 py-3 rounded font-bold text-lg shadow-md transition-transform active:scale-95"
                    >
                      Got it
                    </button>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar Stats Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden sticky top-20">
            <div className="flex flex-col divide-y divide-gray-100">
              
              {/* Questions Answered */}
              <div className="p-5 flex justify-between items-center">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Questions<br/>Answered</div>
                <div className="text-3xl font-light text-gray-600 font-mono">{questionsAnswered}</div>
              </div>

              {/* Time Elapsed */}
              <div className="p-5 flex justify-between items-center">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Time<br/>Elapsed</div>
                <div className={`text-3xl font-light font-mono ${isPaused ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatTime(timer)}
                </div>
              </div>

              {/* SmartScore */}
              <div className={`p-5 transition-colors duration-700 relative overflow-hidden ${isChallengeZone ? 'bg-[#1a2332]' : 'bg-white'}`}>
                {/* Challenge Zone Background Effect */}
                {isChallengeZone && (
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                )}
                
                <div className="flex justify-between items-center mb-2 relative z-10">
                  <div className={`text-xs font-bold uppercase tracking-wide ${isChallengeZone ? 'text-[#ffac00]' : 'text-gray-400'}`}>
                    SmartScore
                    <br /><span className="text-[10px] font-normal normal-case opacity-75">out of 100</span>
                  </div>
                  <div className={`text-5xl font-bold font-mono tracking-tighter ${isChallengeZone ? 'text-[#ffac00]' : 'text-[#ffac00]'}`}>
                    {smartScore}
                  </div>
                </div>
                
                {/* Challenge Zone Banner */}
                {isChallengeZone && (
                  <div className="mt-3 flex items-center justify-center space-x-2 text-[#ffac00] text-xs font-extrabold uppercase tracking-widest animate-pulse border border-[#ffac00] rounded py-1">
                    <Award size={14} />
                    <span>Challenge Zone</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gamification: Ribbons */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
             <div className="text-xs font-bold text-gray-400 uppercase mb-3 text-center">Next Prize</div>
             <div className="flex justify-center space-x-2 opacity-40 grayscale hover:grayscale-0 transition-all cursor-help" title="Answer more to unlock!">
               <Trophy size={32} className="text-yellow-500" />
               <Trophy size={32} className="text-blue-500" />
               <Trophy size={32} className="text-purple-500" />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function IxlClone() {
  const [view, setView] = useState('home'); // 'home', 'practice'
  const [currentSkillId, setCurrentSkillId] = useState(null);

  const navigateToPractice = (id) => {
    setCurrentSkillId(id);
    setView('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {view === 'home' && (
        <>
          <Header onNavigate={navigateToHome} currentView={view} />
          <div className="bg-[#f8f8f8] min-h-screen pb-20">
            {/* Hero Area */}
            <div className="bg-[#dcfce7] border-b border-gray-200 pt-12 pb-10 px-4 text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-[#166534] mb-4">
                Learning that sticks
              </h1>
              <p className="text-[#166534] text-lg max-w-3xl mx-auto leading-relaxed">
                IXL is the world's most popular subscription-based learning site for K–12. 
                Used by over 15 million students, IXL provides unlimited practice in more than 9,000 topics.
              </p>
              <button className="mt-6 bg-[#009d4f] text-white font-bold py-2 px-6 rounded shadow hover:bg-[#008a45] transition">
                Join now
              </button>
            </div>
            
            {/* Skill List */}
            <SkillDirectory onSelectSkill={navigateToPractice} />
          </div>
        </>
      )}

      {view === 'practice' && (
        <PracticeArena skillId={currentSkillId} onExit={navigateToHome} />
      )}
      
      {/* Global Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-6 mb-4">
          {['Company', 'Membership', 'Blog', 'Help center', 'User guides', 'Tell us what you think', 'Testimonials', 'Careers', 'Contact us'].map(link => (
            <a href="#" key={link} className="hover:text-[#0070c0] hover:underline">{link}</a>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          © 2025 IXL Learning. All rights reserved.
        </p>
      </footer>
    </div>
  );
}