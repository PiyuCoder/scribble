import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./screens/Home";
import { LoaderProvider } from "./context/LoaderContext";
import Lobby from "./screens/Lobby";
import { GameProvider } from "./context/GameContext";
import Game from "./screens/Game";
import Loader from "./components/Loader";

const App: React.FC = () => {
  return (
    <LoaderProvider>
      <GameProvider>
        <Router>
          <Loader />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </Router>
      </GameProvider>
    </LoaderProvider>
  );
};

export default App;
