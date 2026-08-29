import React from 'react'

function Piece({rank, file, piece}){
  return (
    <div className={`width-12.5% ${piece} p-${rank}${file}`}>
        
    </div>
  )
}
export default Piece