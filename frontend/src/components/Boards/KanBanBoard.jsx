import React from 'react'
import "./kanban_board.css"
import StatusColumn from '../Columns/StatusColumn'
const KanBanBoard = () => {
  return (
    <React.Fragment>
      <div>KanBanBoard</div>
      <StatusColumn/>
    </React.Fragment>
  )
}

export default KanBanBoard