<script>
  import store from "../../store/game.js";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  const close = () => dispatch("close");

  export let settings = {
    show: "image",
    gameSize: 2
  };

  let show = settings.show;
  let gameSize = settings.gameSize;
  function handleClose() {
    store.toggleSettings();
    dispatch("settingsClose", {
      show,
      gameSize
    });
  }
</script>

<style>
  .modal-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
  }

  .modal {
    position: absolute;
    left: 50%;
    top: 50%;
    width: calc(100vw - 4em);
    max-width: 32em;
    max-height: calc(100vh - 4em);
    overflow: auto;
    transform: translate(-50%, -50%);
    padding: 1em;
    border-radius: 0.2em;
    background: white;
  }
</style>

<svelte:options tag={null} accessors={true} />

<div class="modal-background" on:click={handleClose} />
<div class="modal" role="dialog" aria-modal="true">

  <slot />

  <p>
    <span>How many tiles</span>
    <input type="number" bind:value={gameSize} max={8} min={2} />
  </p>

  <p>
    <span>Do you want to see</span>
    <select bind:value={show}>
      <option value="image">Image</option>
      <option value="text">Text</option>
    </select>
  </p>

  <button class="br3" on:click={handleClose}>close</button>
</div>
