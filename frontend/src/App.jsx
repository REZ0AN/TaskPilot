import React from 'react'
import Header from './components/Header/Header'
import './App.css'
import KanBanBoard from './components/Boards/KanBanBoard'
const App = () => {
  return (
    <React.Fragment>
      <Header/>
      <KanBanBoard/>
    </React.Fragment>
  )
}

export default App