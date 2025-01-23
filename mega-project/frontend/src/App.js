import {Routes, Route} from 'react-router-dom';
import Dashboard from './pages/Dashboard';

function App(){
  return (
    <Routes>
      {/* <Route path='/signup' element={<Signup />} />
      <Route path='/login' element={<Login />} /> */}
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/' element={<Dashboard />} />
    </Routes>
  );
}

export default App;