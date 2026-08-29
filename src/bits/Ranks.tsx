import React from 'react'

function Ranks({ranks}: any) {
  return (
    <div className='flex flex-col items-center justify-around text-dark-tile'>
        {ranks.map(rank => <span key={rank}>{rank}</span>)}
    </div>
  )
}

export default Ranks