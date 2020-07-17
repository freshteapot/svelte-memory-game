<script>
  import * as aList from "../public/data/alist.json";
  import Game from "./components/game.svelte";

  const data = aList.data.map(item => {
    item.img = `data/${item.img}`;
    return item;
  });
</script>

<Game gameData={data.slice(0, 8)} />
