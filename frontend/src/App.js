import './App.css';
import { TopNav, Header, Footer, CoolPage } from './components/Header&Footer/HeaderFooter';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import ChatBot from './components/ChatBot/ChatBot';
import { useLocation } from 'react-router-dom';
import LiveChat from './components/ChatBot/LiveChat';
function App() {
  const location = useLocation();
  const path = location.pathname.split('/')[1] || '';
  return (
    <div className="App">
      <div className="web">
        <TopNav />
        <Header />
        <div className="web-content">
          <Outlet />
        </div>
        <ChatBot />
        <CoolPage />
        <Footer />
        <LiveChat />
      </div>
    </div>
  );
}

export default App;
