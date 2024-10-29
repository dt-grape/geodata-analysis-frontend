<script setup>
import L from "leaflet";
import { onMounted, ref, toRaw } from "vue";

import "./assets/leaflet.css";
import axios from "./axios.js";

const map = ref(null);
const currentLatLng = ref(null);
const loadObjects = async () => {
  const response = await axios.get("/");
  console.log(response.data);

  const objects = response.data;

  objects.forEach((object) => {
    L.marker([object.latitude, object.longitude])
      .addTo(toRaw(map.value))
      .bindPopup(object.name)
      .openPopup();
  });
};

onMounted(() => {
  map.value = L.map("map").setView([54.986392, 82.862919], 20);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map.value);

  map.value.on("click", onMapClick);

  loadObjects();
});

const onMapClick = (e) => {
  currentLatLng.value = e.latlng;
  console.log(currentLatLng.value);
};
</script>

<template>
  <div class="flex w-screen h-screen items-center justify-center">
    <div class="bg-gray rounded-xl w-[1200px] h-[800px]">
      <div id="map"></div>
    </div>
  </div>
</template>

<style scoped>
#map {
  height: 100%;
  width: 100%;
}
</style>
