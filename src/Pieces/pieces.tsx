import React from 'react'
import Piece from './Piece'

function pieces() {
  
    let position = new Array(8).fill('').map(x => new Array(8).fill(''));
    position[0][0]="2"
    position[3][0]="4"
    console.log(position);

    return (
    <div className='absolute left-0 right-0 top-0 bottom-0'>
        {
            position.map((r, rank) => 
                r.map((f, file) => 
                    position[rank][file] ? <Piece key={rank+"-"+file} rank={rank} file={file} piece={position[rank][file]}/> : null
                )
            )
        }
    </div>
  )
}

export default pieces