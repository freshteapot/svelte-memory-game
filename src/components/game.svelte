<script>
  import store from "../store/game.js";

  import Dashboard from "./dashboard/dashboard.svelte";
  import Chessboard from "./card/chessboard.svelte";
  import PlayStatus from "./footer/play_status.svelte";
  import { STATUS } from "../store/status_enum.js";
  import { shuffle } from "../lib/shuffle.js";

  export let gameData = [];

  let show = "text";
  let settings = {
    show: "image",
    gameSize: gameData.length
  };

  function restartGame() {
    return {
      leftMatched: settings.gameSize,
      highestSpeed: localStorage.getItem("highestSpeed") || "",
      status: STATUS.READY,
      cards: shuffle(gameData.slice(0, settings.gameSize)).map(item => {
        item.flipped = false;
        item.show = settings.show;
        return item;
      }),
      elapsedMs: 0,
      displayEnd: false,
      displayNameInput: false,
      displaySettings: false,
      ranks: [],
      userName: localStorage.getItem("userName") || ""
    };
  }

  function triggerRestart() {
    store.reset(restartGame());
  }

  function settingsClose(event) {
    settings = event.detail;
    triggerRestart();
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
  <PlayStatus
    status={$store.status}
    elapsedMs={$store.elapsedMs}
    gameSettings={settings}
    on:settingsClose={settingsClose} />
</div>
