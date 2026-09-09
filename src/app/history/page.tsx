"use client"
import React, { useEffect, useState } from 'react'
import axios from "axios"

function page() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true)

    useEffect(() => {
      async function getHistory(){
        try{
          const data = await axios.get("/api/matches");
          // console.log(data);
          console.log(data.data.matches)
          setMatches(data.data.matches)
          console.log(matches)
        } catch(err){
            console.log("Error: ", err)
        }
      }
      getHistory();
    }, [])

  return (
    <div>
      <h1>Past Matches</h1>
      <div>
        {matches.map((match: any) => (
          <div key={match.id} className="border p-4 my-2 rounded">
            <div>ID: {match.id}</div>
            <div>Opponent: {match.opponentType}</div>
            <div>Color: {match.playerColor}</div>
            <div>Player 2: {match.player2Name}</div>
            <div>Result: {match.result}</div>
          </div>
        ))}
    </div>
    </div>
  )
}

export default page