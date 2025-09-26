import React from 'react'
import "./status_column.css"
import TicketCard from '../Cards/TicketCard/TicketCard'
import DropAreaCard from '../Cards/DropAreaCard/DropAreaCard'
const StatusColumn = () => {
  return (
    <React.Fragment>
      <div>StatusColumn</div>
      <TicketCard/>
      <DropAreaCard/>
    </React.Fragment>
  )
}

export default StatusColumn