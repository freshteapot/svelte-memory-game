<script>
  // mapGetters(["userName", "elapsedMs", "status"])
  //import { mapGetters } from "vuex";
  import { STATUS } from "../../store/status_enum.js";

  export let status = STATUS.READY;
  export let elapsedMs = "10";
</script>

<style>
  .status-footer {
    position: relative;
    margin-top: 10px;
    width: 100%;
    height: 20px;
    line-height: 20px;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
  }
  .elapsed {
    position: absolute;
    right: 10px;
    font-size: 15px;
    font-weight: normal;
  }
</style>

<div class="status-footer">

  {#if status === STATUS.PLAYING}
    <span>Playing</span>
  {/if}

  <span class="elapsed">{elapsedMs} s</span>
</div>
