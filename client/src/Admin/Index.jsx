import React from 'react'
import CreateLogins from './CreateLogins'
import Staffs from './Staffs'
import EventController from './EventCoordinator'
const Index = () => {
  return (
    <div className=' bg-gray-50 '>
        <div className='flex  flex-row gap-0'>
        <CreateLogins/>
        <EventController/>
        </div>
        <Staffs/>
    </div>
  )
}

export default Index