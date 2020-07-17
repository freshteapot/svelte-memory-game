<script>
  import store from "../store/game.js";

  import Dashboard from "./dashboard/dashboard.svelte";
  import Chessboard from "./card/chessboard.svelte";
  import PlayStatus from "./footer/play_status.svelte";
  import { STATUS } from "../store/status_enum.js";
  import { shuffle } from "../lib/shuffle.js";

  export let gameData = [{ name: "", img: "" }];

  function restartGame() {
    return {
      leftMatched: gameData.length,
      highestSpeed: localStorage.getItem("highestSpeed") || "",
      status: STATUS.READY,
      cards: shuffle(gameData).map(item => {
        item.flipped = false;
        return item;
      }),
      elapsedMs: 0,
      displayEnd: false,
      displayNameInput: false,
      ranks: [],
      userName: localStorage.getItem("userName") || ""
    };
  }

  function triggerRestart() {
    store.reset(restartGame());
  }

  triggerRestart();
</script>

<style>
  .game-panel {
    position: relative;
    width: 450px;
    height: 670px;
    border: 4px solid #bdbdbd;
    border-radius: 2px;
    background-color: #faf8ef;
    padding: 10px;
    display: flex;
    flex-direction: column;
  }

  @media screen and (max-width: 450px) {
    .game-panel {
      width: 100%;
      height: 100%;
      justify-content: space-around;
    }
  }
</style>

<div class="game-panel">
  <Dashboard
    leftMatched={$store.leftMatched}
    highestSpeed={$store.highestSpeed}
    on:restart={triggerRestart} />
  <Chessboard cards={$store.cards} />
  <PlayStatus status={$store.status} elapsedMs={$store.elapsedMs} />
</div>
