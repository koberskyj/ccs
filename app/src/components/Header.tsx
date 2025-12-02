import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="hidden">
      <div className="max-w-[1280px] m-auto w-full px-2 flex items-center">
        <div className="h-16">
          <img className="h-full" src="/logo.svg" />
        </div>
        <nav className=''>
          <Link to='/' className=''>Home</Link>
          <Link to='/about'>About</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;