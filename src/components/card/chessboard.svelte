<script>
  import store from "../../store/game.js";

  import Card from "./card.svelte";
  import { STATUS } from "../../store/status_enum.js";
  import { copyObject } from "../../lib/utils.js";

  export let cards = [];
  export let lastCard = null;

  function onFlipped(e) {
    const card = e.detail;
    if ($store.status === STATUS.READY) {
      store.updateStatus(STATUS.PLAYING);
    }

    if (!lastCard) {
      lastCard = card;
      return;
    }

    if (lastCard !== card && lastCard.name === card.name) {
      lastCard = null;
      store.match();
      return $store.leftMatched || store.updateStatus(STATUS.PASS);
    }

    const oldCard = lastCard;
    lastCard = null;

    setTimeout(() => {
      store.flipCards([oldCard, card]);
    }, 1000);
  }

  /*
    computed: {
      ...mapGetters(["leftMatched", "cards", "status"])
    },

    methods: {
      ...mapActions(["updateStatus", "match", "flipCards"]),

      onFlipped: function(e) {
        if (this.status === STATUS.READY) {
          this.updateStatus(STATUS.PLAYING);
        }
        if (!this.lastCard) {
          return (this.lastCard = e);
        }
        if (this.lastCard !== e && this.lastCard.cardName === e.cardName) {
          this.lastCard = null;
          this.match();
          return this.leftMatched || this.updateStatus(STATUS.PASS);
        }
        let lastCard = this.lastCard;
        this.lastCard = null;
        setTimeout(() => {
          this.flipCards([lastCard, e]);
        }, 1000);
      }
    },
  };
    */
</script>

<style>
  .chessboard {
    margin-top: 20px;
    width: 100%;
    background-color: #fff;
    height: 530px;
    border-radius: 4px;
    padding: 10px 5px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    align-content: space-around;
  }

  .container:nth-child(4n) {
    margin-right: 0px;
  }

  @media screen and (max-width: 450px) {
    .chessboard {
      height: 480px;
      padding: 10px 0px;
    }
  }
  @media screen and (max-width: 370px) {
    .chessboard {
      height: 450px;
    }
  }
</style>

<div class="chessboard">
  {#each cards as card, index}
    <Card key={index} option={card} on:flipped={onFlipped} />
  {/each}
</div>
