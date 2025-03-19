<script setup lang="ts">
import { ref, watch } from 'vue';
import { debounce, retry } from 'radash';
import { PokemonApi, type Pokemon } from './lib/PokemonApi';

const api = new PokemonApi();

const search = ref<string>('');
const results = ref<Pokemon[]>([]);
const errorMessage = ref<string>('');
const state = ref<string>('Unrequested');
const chaosMode = ref<boolean>(false);

const executeSearch = async (): Promise<void> => {
  try {
    if (search.value.length > 0) {
      state.value = 'Loading';

      errorMessage.value = '';
      results.value = [];

      const searchResults = await retry({ times: 5 }, () => api.search(search.value));

      if (searchResults.length > 0) {
        state.value = 'Fetched results';
        results.value = searchResults;
      } else {
        state.value = 'Empty results';
        results.value = [];
      }
    } else {
      state.value = 'Unrequested';
      results.value = [];
      errorMessage.value = '';
    }
  } catch (error) {
    state.value = 'Error';
    errorMessage.value = (error as unknown as string).toString();
  }
}

const debouncedSearch = debounce({ delay: 500 }, executeSearch);

watch(chaosMode, (newVal: boolean) => {
  api.hasChaosEnabled = newVal;
});

watch(search, () => {
  debouncedSearch();
});
</script>

<template>
  <div>
    <input type="text" v-model="search"/>
    <input type="checkbox" v-model="chaosMode" id="chaosMode"/>
    <label for="chaosMode">Chaos Mode</label>
    <ul>
      <li v-for="pokemon in results" :key="pokemon.id">
        <span>{{ pokemon.name }}</span>
      </li>
    </ul>
    <div>{{ state }}</div>
    <div v-show="errorMessage.length > 0">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>

</style>
