import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/adminlte.css';

import Dashboard from './components/Dashboard';
import LiveCategories from './components/LiveCategories';
import LiveStreams from './components/LiveStreams';
import VodCategories from './components/VodCategories';
import VodStreams from './components/VodStreams';
import SeriesCategories from "./components/SeriesCategories";
import SeriesStreams from "./components/SeriesStreams";
import Seasons from "./components/Seasons";
import Episodes from "./components/Episodes";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live-categories" element={<LiveCategories />} />
        <Route path="/live-streams" element={<LiveStreams />} />
        <Route path="/vod-categories" element={<VodCategories />} />
        <Route path="/vod-streams" element={<VodStreams />} />
        <Route path="/series-categories" element={<SeriesCategories />} />
        <Route path="/series-streams" element={<SeriesStreams />} />
        <Route path="/seasons" element={<Seasons />} />
        <Route path="/episodes" element={<Episodes />} />
      </Routes>
    </Router>
  );
}

export default App;
