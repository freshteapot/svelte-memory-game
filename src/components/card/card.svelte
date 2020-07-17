<script>
  //import { mapActions } from 'vuex';
  import store from "../../store/game.js";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let key;
  export let option = {
    flipped: false,
    name: "",
    img: ""
  };

  function flip() {
    // action flipcard?
    if (option.flipped) {
      return;
    }
    //option.flipped = !option.flipped;
    //this.flipCard(this.option);
    store.flipCard(option);
    //this.$emit('flipped', this.option);
    dispatch("flipped", option);
  }

  console.log(key);
  console.log(option);
  $: flipped = option.flipped ? "flipped" : "";
</script>

<style>
  .container {
    width: 100px;
    height: 121px;
    margin-right: 3px;
    cursor: pointer;
    position: relative;
    perspective: 800px;
  }

  .card {
    width: 100%;
    height: 100%;
    transition: transform 1s;
    transform-style: preserve-3d;
  }

  .card.flipped {
    transform: rotateY(180deg);
  }

  .card img {
    display: block;
    height: 100%;
    width: 100%;
    position: absolute;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .card .back {
    background: white;
    transform: rotateY(0deg);
  }

  .card .front {
    background: white;
    transform: rotateY(180deg);
  }

  @media screen and (max-width: 450px) {
    .container {
      width: 92px;
      height: 111px;
      margin-right: 1px;
    }
  }

  @media screen and (max-width: 380px) {
    .container {
      width: 85px;
      height: 102px;
      margin-right: 1px;
    }
  }

  @media screen and (max-width: 360px) {
    .container {
      width: 70px;
      height: 84px;
      margin-right: 1px;
    }
  }
</style>

<div class="container" on:click={flip}>
  <div class="card {flipped}">
    <img class="front" src={option.img} />

    <img class="back" src="data/back.png" />
  </div>
</div>
