import { About } from './components/About';
import { ChatWidget } from './components/ChatWidget';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Paths } from './components/Paths';
import { Process } from './components/Process';
import { Solutions } from './components/Solutions';
import { useIntroAnimation, useScrollReveal } from './hooks/useMotion';
import { chatClient } from './lib/chat';

export default function App() {
  useIntroAnimation();
  useScrollReveal();

  return (
    <>
      <a className="skip-link" href="#nosotros">
        Saltar al contenido
      </a>
      <Header />
      <main>
        <Hero />
        <About />
        <Solutions />
        <Process />
        <Paths />
        <Contact />
      </main>
      <Footer />
      {/* Chat de Fontanachat: solo si hay VITE_API_BASE_URL y la API responde. */}
      {chatClient && <ChatWidget client={chatClient} />}
    </>
  );
}
