import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from '@/pages/HomePage';
import Aboutpage from '@/pages/AboutPage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from 'sonner';
import { ProgramsProvider } from './utils/ProgramsContext';

function RouteList() {
  return (
    <div className='max-w-[1280px] m-auto w-full px-2 grow'>
      <ProgramsProvider>
        <Routes>
          <Route path='/' element={<Homepage />} />
          <Route path='/about' element={<Aboutpage />} />
        </Routes>
      </ProgramsProvider>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className='bg-background text-foreground min-h-svh antialiased flex flex-col'>
        <Header />
        <RouteList />
        <Footer />
      </div>
      <Toaster richColors />
    </Router>
  );
}

export default App;