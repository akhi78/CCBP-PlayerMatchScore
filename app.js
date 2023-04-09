const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const Dbpath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());

let db = null;

//initializing DB and Server
const InitializeDbandServer = async () => {
  try {
    db = await open({
      filename: Dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running....");
    });
  } catch (e) {
    console.log(`DB error is ${e.message}`);
    process.exit(1);
  }
};

InitializeDbandServer();

//creating function for playerID
const PlayerObj = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};

//creating function for MatchId
const matchObj = (match) => {
  return {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  };
};

//API 1 getting details of players

app.get("/players/", async (request, response) => {
  const Query = `SELECT * FROM player_details`;
  const AllPlayers = await db.all(Query);
  response.send(
    AllPlayers.map((eachplayer) => {
      return {
        playerId: eachplayer.player_id,
        playerName: eachplayer.player_name,
      };
    })
  );
});

// API 2 getting player details on playerID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const Query = `SELECT * FROM player_details WHERE player_id=${playerId}`;
  const playerRes = await db.get(Query);
  response.send(PlayerObj(playerRes));
});

//API 3 updating pllayer details

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const Query = `UPDATE player_details SET player_name='${playerName}' where player_id='${playerId}'`;
  const PutResponse = await db.run(Query);
  response.send("Player Details Updated");
});

//API 4 Getting matches details form match table

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const Query = `SELECT * FROM match_details WHERE match_id=${matchId}`;
  const matchRes = await db.get(Query);
  response.send(matchObj(matchRes));
});

// API 5 getting match detail form player id

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const Query = `SELECT 
  match_id as matchId,
  match,
  year 
  FROM 
  player_match_score NATURAL JOIN match_details 
  WHERE 
  player_id=${playerId};`;
  const matchDetails = await db.all(Query);
  //   console.log(matchDetails);
  response.send(matchDetails);
});

//API 6 getting player details from match id

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const Query = `SELECT *
   FROM 
   player_match_score natural JOIN player_details 
   WHERE match_id=${matchId};`;
  const PlayerDetails = await db.all(Query);
  //   console.log(PlayerDetails);
  response.send(
    PlayerDetails.map((player) => {
      PlayerObj(player);
    })
  );
});

//API7 getting player statics form playerId
//convert player stats to object
const playerStatsObject = (playerName, statsObj) => {
  return {
    playerId: statsObj.player_id,
    playerName: playerName,
    totalScore: statsObj.totalScore,
    totalFours: statsObj.totalFours,
    totalSixes: statsObj.totalSixes,
  };
};
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
    SELECT player_name
        FROM player_details
    WHERE player_id=${playerId};`;
  const getPlayerNameResponse = await db.get(getPlayerNameQuery);
  const getPlayerStatisticsQuery = `
    SELECT 
        player_id,
        sum(score) AS totalScore,
        sum(fours) AS totalFours,
        sum(sixes) AS totalSixes
    FROM 
        player_match_score
    WHERE 
        player_id=${playerId};`;

  const getPlayerStatisticsResponse = await db.get(getPlayerStatisticsQuery);
  response.send(
    playerStatsObject(
      getPlayerNameResponse.player_name,
      getPlayerStatisticsResponse
    )
  );
});

module.exports = app;
