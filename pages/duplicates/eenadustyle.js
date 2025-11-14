import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

// ===================================================================
// 1. SAMPLE DATA (Eenadu-style)
// ===================================================================
const articlesPerPage = 10;
const totalArticlesToGenerate = 40;

const createSampleArticle = (i) => {
  const titles = [
    'నెట్‌ఫ్లిక్స్‌ మంగళవారం బంద్‌: వణికిపోతున్న యూజర్లు!',
    'ఏంటి? రెండు పెళ్లిళ్లకూ ‘గీత’ గుట్టు.. అసలేం జరిగింది?',
    '48 మంది ఎమ్మెల్యేలకు నోటీసులిచ్చింది: సీఎం చంద్రబాబు',
    'వర్షం కారణంగా మ్యాచ్‌ రద్దు.. టీమ్‌ఇండియానే సిరీస్‌ విజేత',
    'యూత్‌లో భారీ క్రేజ్‌.. వచ్చేసి ఫుల్‌ జోష్‌లో.. నా లైఫ్‌ మారుతుందా?',
    'ఓటీటీలోకి ‘కె-డ్రామా’.. అధికారికంగా ప్రకటించిన సంస్థ',
    'జాబితాల్లో తన ఎన్నిక.. హైదరాబాద్‌ సీపీ నల్గొండకు కీలక ఆదేశాలు',
    'సూర్యుడింతే.. పొలార్డ్‌ క్యాచ్‌ అదిరింది',
    '300 కి.మీ వద్ద భారీ వర్షం.. పొంచి ఉన్న విపత్తు',
    'ఆ ప్రాంతం మంచి అబ్బాయిలు!',
    'ఓటీటీలో ‘ది బెంగుల్‌ స్టోరీ’.. స్ట్రీమింగ్‌ ఎక్కడంటే?',
  ];
  
  const summaries = [
    'ఆ రోజునా నెట్‌ఫ్లిక్స్‌ సేవలు నిలిచిపోనున్నాయి. దీంతో యూజర్లు ఆందోళన చెందుతున్నారు. మంగళవారం స్ట్రీమింగ్‌ సేవలకు అంతరాయం కలగనుంది.',
    'గీత గోపీనాథ్ రెండు పెళ్లిళ్ల గురించి ఒక వింత నిజం బయటపడింది. అసెంబ్లీ ఎలెక్షన్స్ లో ఇది ఒక ముఖ్య అంశం అయ్యింది.',
    'ముఖ్యమంత్రి చంద్రబాబు నాయుడు గారు ఈ రోజు ప్రెస్ మీట్ లో ఈ విషయం చెప్పారు. 48 మందికి నోటీసులు పంపినట్లు తెలిపారు.',
    'భారత్ మరియు ఆస్ట్రేలియా మధ్య జరగాల్సిన మ్యాచ్ వర్షం కారణంగా రద్దు అయ్యింది. దీంతో టీమ్‌ఇండియా సిరీస్‌ను కైవసం చేసుకుంది.',
    'యువతలో ఈ కొత్త సినిమాకి మంచి క్రేజ్ వచ్చింది. హీరో కూడా ఫుల్ జోష్ లో ఉన్నాడు. తన లైఫ్ మారుతుందని ఆశిస్తున్నాడు.',
    'ప్రముఖ కొరియన్ డ్రామా ఇప్పుడు ఓటీటీలోకి రానుంది. ఈ విషయాన్ని ప్రముఖ సంస్థ అధికారికంగా ప్రకటించింది.',
    'హైదరాబాద్‌ సీపీ నల్గొండకు ఎన్నికల జాబితా గురించి కీలక ఆదేశాలు జారీ చేశారు. తన ఎన్నిక సజావుగా జరగాలని కోరారు.',
  ];

  const images = [
    'https://placehold.co/600x400/E50914/FFFFFF?text=NETFLIX', // Hero
    'https://placehold.co/150x100/333/EEE?text=Eenadu',
    'https://placehold.co/150x100/555/EEE?text=Eenadu',
    'https://placehold.co/150x100/777/EEE?text=Eenadu',
    'https://placehold.co/150x100/999/EEE?text=Eenadu',
    'https://placehold.co/150x100/AAA/EEE?text=Eenadu',
    'https://placehold.co/150x100/CCC/EEE?text=Eenadu',
  ];

  const id = (totalArticlesToGenerate - i).toString();
  
  return {
    _id: id,
    title: titles[i % titles.length],
    summary: summaries[i % summaries.length],
    // Use placeholder images
    imageUrl: images[i % images.length],
    createdAt: new Date(Date.now() - i * 3600 * 1000 * 2).toString(), // New article every 2 hours
    slug: `article-${id}`,
  };
};

const sampleArticles = Array.from({ length: totalArticlesToGenerate }, (_, i) => 
  createSampleArticle(i)
);


// ===================================================================
// 2. LOCAL COMPONENTS
// ===================================================================

// --- SeoHead Component ---
function SeoHead({ title, description }) {
  const siteTitle = 'Eenadu.net | The Pulse of Telugu States';
  const fullTitle = `${title} | ${siteTitle}`;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}

// --- Header Component ---
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = ['ఆంధ్రప్రదేశ్', 'తెలంగాణ', 'జాతీయం', 'అంతర్జాతీయం', 'క్రైమ్', 'బిజినెస్‌', 'క్రీడలు', 'సినిమా'];

  return (
    <header className="border-b bg-white shadow-sm">
      {/* Top bar */}
      <div className="hidden bg-gray-100 py-1 text-xs text-gray-600 md:block">
        <div className="container mx-auto flex max-w-6xl justify-between px-4">
          <span>శనివారం, నవంబర్ 08, 2025</span>
          <div className="flex space-x-2">
            <span>Follow us:</span>
            {/* Add social icons here if needed */}
          </div>
        </div>
      </div>
      
      {/* Main Nav */}
      <nav className="container mx-auto flex max-w-6xl items-center justify-between p-4">
        {/* Logo */}
        <div>
          <Link href="/" className="text-3xl font-bold text-blue-600">
            ఈనాడు.నెట్
          </Link>
        </div>
        
        {/* Desktop Nav Links */}
        <div className="hidden lg:flex flex-wrap space-x-4">
          {navItems.map(item => (
            <a key={item} href="#" className="font-medium text-gray-700 hover:text-blue-600">
              {item}
            </a>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded p-2 text-gray-700 ring-1 ring-gray-300">
            {menuOpen ? 'మూసివేయండి' : 'మెనూ'}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {menuOpen && (
        <div className="border-t lg:hidden">
          {navItems.map(item => (
            <a key={item} href="#" className="block border-b px-4 py-3 font-medium text-gray-700 hover:bg-gray-50">
              {item}
            </a>
          ))}
        </div>
      )}
      
      {/* Sub Nav (Blue) */}
      <div className="bg-blue-700 text-white">
        <div className="container mx-auto flex max-w-6xl space-x-4 overflow-x-auto px-4 py-2 text-sm font-semibold">
          <a href="#" className="bg-red-600 px-2 py-1 text-white">జిల్లా వార్తలు</a>
          <a href="#" className="whitespace-nowrap hover:underline">ఆంధ్రప్రదేశ్</a>
          <a href="#" className="whitespace-nowrap hover:underline">తెలంగాణ</a>
          <a href="#" className="whitespace-nowrap hover:underline">ఎలెక్షన్స్</a>
          <a href="#" className="whitespace-nowrap hover:underline">వీడియోలు</a>
          <a href="#" className="whitespace-nowrap hover:underline">స్పోర్ట్స్</a>
          <a href="#" className="whitespace-nowrap hover:underline">సినిమా</a>
        </div>
      </div>
    </header>
  );
}

// --- ArticleCardGrid (For the 2x3 grid) ---
function ArticleCardGrid({ article }) {
  return (
    <a href="#" className="group flex space-x-3">
      <img 
        src={article.imageUrl} 
        alt={article.title} 
        className="w-28 h-20 flex-shrink-0 object-cover rounded" 
      />
      <h3 className="text-md font-semibold text-gray-800 group-hover:text-blue-600">
        {article.title}
      </h3>
    </a>
  );
}

// --- SidebarNewsItem (For "Latest News") ---
function SidebarNewsItem({ article }) {
  const timestamp = new Date(article.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return (
    <li className="flex items-center space-x-2 border-b py-2 last:border-b-0">
      <span className="w-2 h-2 bg-red-600 inline-block" />
      <a href="#" className="flex-1 text-sm text-gray-800 hover:text-blue-600">
        {article.title}
      </a>
      <span className="text-xs text-gray-500">[{timestamp}]</span>
    </li>
  );
}


// ===================================================================
// 3. HOME PAGE (Your Main Component)
// ===================================================================
export default function Home({ initialArticles, totalPosts }) {
  
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length < totalPosts);

  // This function simulates fetching more posts
  const loadMorePosts = async () => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // --- SIMULATION ---
      const startIndex = (page - 1) * articlesPerPage;
      const endIndex = page * articlesPerPage;
      const newArticles = sampleArticles.slice(startIndex, endIndex);
      const total = sampleArticles.length;
      // --- END SIMULATION ---

      setArticles(prevArticles => [...prevArticles, ...newArticles]);
      setPage(prevPage => prevPage + 1);
      if (articles.length + newArticles.length >= total) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more articles", error);
    }
    
    setIsLoading(false);
  };

  // Derive page content from the 'articles' state
  const heroArticle = articles[0];
  const gridArticles = articles.slice(1, 7); // Show first 6 after hero
  const sidebarArticles = articles.slice(0, 10); // Show 10 in sidebar
  const moreArticles = articles.slice(7); // Rest of the loaded articles

  return (
    <div className="bg-gray-100">
      <SeoHead 
        title="Homepage" 
        description="The very latest Telugu news on politics, crime, sports, and cinema."
      />
      
      <Header />

      {/* Main Content Area */}
      <div className="container mx-auto max-w-6xl p-4">
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column (Main) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Hero Section */}
            {heroArticle && (
              <div className="bg-white p-4 shadow rounded">
                <img 
                  src={heroArticle.imageUrl} 
                  alt={heroArticle.title} 
                  className="w-full h-auto object-cover mb-2 rounded" 
                />
                <h2 className="text-3xl font-bold text-gray-900 hover:text-blue-600">
                  <a href="#">{heroArticle.title}</a>
                </h2>
                <p className="text-gray-600 mt-2">{heroArticle.summary}</p>
              </div>
            )}
            
            {/* Article Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-4 shadow rounded">
              {gridArticles.map(article => (
                <ArticleCardGrid key={article._id} article={article} />
              ))}
            </div>

            {/* "More Articles" list (from "Load More") */}
            <div className="bg-white p-4 shadow rounded space-y-4">
              {moreArticles.map(article => (
                <ArticleCardGrid key={article._id} article={article} />
              ))}
            </div>

            {/* Load More Button */}
            <div className="mt-8 text-center">
              {hasMore && (
                <button
                  onClick={loadMorePosts}
                  disabled={isLoading}
                  className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isLoading ? 'Loading...' : 'మరిన్ని లోడ్ అవుతున్నాయి...'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Ad Placeholder */}
            <div className="bg-gray-200 h-64 flex items-center justify-center rounded shadow p-4">
              <span className="text-gray-500">Ad Placeholder (Zoho)</span>
            </div>
            
            {/* Latest News Sidebar */}
            <div className="bg-white p-4 shadow rounded">
              <h3 className="text-xl font-bold text-red-600 border-b-2 border-red-600 pb-2 mb-4">
                తాజా వార్తలు
              </h3>
              <ul className="space-y-2">
                {sidebarArticles.map(article => (
                  <SidebarNewsItem key={article._id} article={article} />
                ))}
              </ul>
            </div>

            {/* Another Ad Placeholder */}
            <div className="bg-gray-200 h-48 flex items-center justify-center rounded shadow p-4">
              <span className="text-gray-500">Ad Placeholder</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


// ===================================================================
// 4. getStaticProps
// ===================================================================
export async function getStaticProps() {
  // Use our local sample data
  const initialArticles = sampleArticles.slice(0, articlesPerPage);
  const totalPosts = sampleArticles.length;

  return {
    props: {
      initialArticles: initialArticles,
      totalPosts: totalPosts,
    },
  };
}