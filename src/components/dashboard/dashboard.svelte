<script>
  import store from "../../store/game.js";
  import Logo from "./logo.svelte";
  import MatchInfo from "./match_info.svelte";
  import Score from "./score.svelte";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let leftMatched;
  export let highestSpeed;

  function onTryAgain() {
    dispatch("restart");
  }
</script>

<style>
  .status-bar {
    width: 100%;
    height: 100px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .try-again {
    margin-top: 2rem;
    width: 100%;
    height: 100%;
    text-align: center;
  }
</style>

<div class="status-bar">
  <Logo />
  <MatchInfo bind:leftMatched />
  <Score bind:highestSpeed />
</div>

{#if $store.displayEnd}
  <div class="status-bar">
    <button class="try-again" on:click={onTryAgain}>Try again?</button>
  </div>
{/if}
