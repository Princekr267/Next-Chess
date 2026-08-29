"use client"
import Pieces from '@/Pieces/pieces'
import Ranks from '../../bits/Ranks'
import Files from '../../bits/Files'
import "./Board.css"

function Board(){
    const getClassName = (i: number, j: number) => {
        let c = 'tile'
        c += (i + j) % 2 === 0 ? ' tile-light' : ' tile-dark'
        return c
    }

    const ranks: number[] = Array(8).fill(0).map((x, i) => 8-i)
    const files: string[] = Array(8).fill(0).map((x, i) => {
        return String.fromCharCode(i+97)
    })

    return (
        <div className='board'>
        <Ranks className='rank' ranks={ranks} />
        <div className='grid grid-cols-8 border-2 border-sky-500'>
            {
                ranks.map((rank, i) => {
                    return files.map((file, j) => (
                        <div key={`${i}-${j}`} className={getClassName(i, j)}>
                            
                        </div>
                    ));
                    // <img src="/pawn.png" alt="" />
                })
            }
        </div>
        <Pieces />
        <Files files={files} />
    </div>
  )
}

export default Board