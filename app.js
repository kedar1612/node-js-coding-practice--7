const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

const app = express()
app.use(express.json())

let db = null

const intilize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => console.log('success'))
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
intilize()

const convertPlayers = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
const convertMatchDetails = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

// get all players
app.get('/players/', async (request, response) => {
  const getAllPlayer = `
    SELECT 
       *
    FROM 
      player_details;`

  const playerArray = await db.all(getAllPlayer)
  response.send(playerArray.map(eachPlayer => convertPlayers(eachPlayer)))
})
// get specific player
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const specificPlayer = `
    SELECT
        * 
    FROM 
      player_details
    WHERE 
      player_id = ${playerId};`
  const player = await db.get(specificPlayer)
  response.send(convertPlayers(player))
})

// update Player
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body

  const updatePlayer = `
      UPDATE 
        player_details
      SET
        player_name = '${playerName}'
      WHERE
        player_id = ${playerId};`
  await db.run(updatePlayer)
  response.send('Player Details Updated')
})

// return get specific match details

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params

  const specificMatch = `
    SELECT 
       *
    FROM 
      match_details
    WHERE
      match_id = ${matchId};`
  const specificMatchDetails = await db.get(specificMatch)
  response.send(convertMatchDetails(specificMatchDetails))
})

// list of all the matches of a player

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchQuery = `
    SELECT
      * 
    FROM
      player_match_score
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`

  const playerMatchQuery = await db.all(getMatchQuery)
  response.send(
    playerMatchQuery.map(eachPlayer => convertMatchDetails(eachPlayer)),
  )
})

// returns a list of players of a specific match

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params

  const api6 = `
    SELECT
      * 
    FROM player_match_score 
    NATURAL JOIN player_details
    WHERE 
      match_id = ${matchId};`
  const array = await db.all(api6)
  response.send(array.map(eachPlayer => convertPlayers(eachPlayer)))
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const api7 = `
    SELECT
        player_id   AS playerId,
        player_name AS playerName,
        SUM(score)  AS totalScore,
        SUM(fours)  AS totalFours,
        SUM(sixes)  AS totalSixes
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE
        player_id = ${playerId};`

  const playeMatchDetails = await db.get(api7)
  response.send(playeMatchDetails)
})
module.exports = app
