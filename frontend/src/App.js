import './App.css';
import { TopNav, Header, Footer, CoolPage } from './components/Header&Footer/HeaderFooter';
import { Outlet } from 'react-router-dom';
import ChatBot from './components/ChatBot/ChatBot';
import LiveChat from './components/ChatBot/LiveChat';
function App() {
  return (
    <div className="App">
      <div className="web">
        <TopNav />
        <Header />
        <div className="web-content">
          <Outlet />
        </div>
        <ChatBot />
        <LiveChat />
        <CoolPage />
        <Footer />
      </div>
    </div>
  );
}

export default App;
