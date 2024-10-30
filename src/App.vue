<script setup>
import L from "leaflet";
import { onMounted, ref, toRaw } from "vue";

import "./assets/leaflet.css";
import axios from "./axios.js";

const map = ref(null);
const currentLatLng = ref({ lat: "", lng: "" });
const bufferCircle = ref(null);
const name = ref("");
const dialogRef = ref(null);
const distance = ref(0);
const userLocation = ref({ lat: null, lng: null });
const distanceDialogRef = ref(null);

const loadObjects = async () => {
  const response = await axios.get("/");
  const objects = response.data;

  objects.forEach((object) => {
    L.marker([object.latitude, object.longitude])
      .addTo(toRaw(map.value))
      .bindPopup(object.name)
      .openPopup();
  });
};

const showBufferZone = async () => {
  if (bufferCircle.value) {
    toRaw(map.value).removeLayer(bufferCircle.value);
  }

  const latitude = userLocation.value.lat;
  const longitude = userLocation.value.lng;

  bufferCircle.value = L.circle([latitude, longitude], {
    radius: distance.value,
    color: "blue",
    fillColor: "#87CEEB",
    fillOpacity: 0.3,
  }).addTo(toRaw(map.value));

  const response = await axios.get(
    `/near?latitude=${latitude}&longitude=${longitude}&distance=${distance.value}`,
  );
  const objects = response.data;

  console.log("Объекты в буферной зоне:", objects);

  objects.forEach((object) => {
    L.marker([object.latitude, object.longitude])
      .addTo(toRaw(map.value))
      .bindPopup(object.name)
      .openPopup();
  });
};

const requestUserLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value.lat = position.coords.latitude;
        userLocation.value.lng = position.coords.longitude;
        distanceDialogRef.value?.showModal();
      },
      (error) => {
        console.error("Ошибка получения геолокации:", error);
      },
    );
  } else {
    console.error("Геолокация не поддерживается этим браузером.");
  }
};

const handleDistanceSubmit = () => {
  distanceDialogRef.value?.close();
  showBufferZone();
};

const onMapClick = (e) => {
  currentLatLng.value = e.latlng;
  dialogRef.value.showModal();
  console.log(e.latlng);
};

const submitData = async () => {
  const data = {
    latitude: currentLatLng.value.lat,
    longitude: currentLatLng.value.lng,
    name: name.value,
  };

  try {
    await axios.post("/", data);
    console.log("Данные успешно отправлены:", data);
    dialogRef.value.close();
    name.value = "";
    L.marker([data.latitude, data.longitude])
      .addTo(toRaw(map.value))
      .bindPopup(data.name)
      .openPopup();
  } catch (error) {
    console.error("Ошибка при отправке данных:", error);
  }
};

onMounted(() => {
  map.value = L.map("map").setView([54.986392, 82.862919], 20);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map.value);

  map.value.on("click", onMapClick);

  loadObjects();
});
</script>

<template>
  <div class="flex w-screen h-screen items-center justify-center">
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div
        class="bg-gray rounded-xl sm:w-[1000px] sm:h-[800px] w-full h-[75vh] relative flex"
      >
        <div id="map" class="w-full h-full"></div>
      </div>
      <div
        class="flex flex-col sm:w-[400px] sm:h-[800px] h-[25vh] w-[95vw] gap-2"
      >
        <div class="flex gap-2 justify-center items-center">
          <button
            @click="requestUserLocation"
            class="bg-blue-500 text-white p-2 rounded"
          >
            Буферная зона
          </button>
          <button class="bg-blue-500 text-white p-2 rounded">Очистить</button>
        </div>
        <div class="bg-gray-100 p-4 rounded-xl">
          <h2>Объекты в буферной зоне:</h2>
        </div>
      </div>
    </div>

    <dialog ref="distanceDialogRef" class="p-6 border rounded-md">
      <h2 class="text-xl font-semibold mb-4">
        Введите дистанцию для буферной зоны
      </h2>
      <form @submit.prevent="handleDistanceSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Дистанция (м)</label
          >
          <input
            type="number"
            v-model="distance"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Введите дистанцию в метрах"
          />
        </div>
        <div class="flex justify-end">
          <button
            type="submit"
            class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Построить
          </button>
          <button
            type="button"
            @click="distanceDialogRef.close()"
            class="ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Отмена
          </button>
        </div>
      </form>
    </dialog>

    <dialog ref="dialogRef" class="p-6 border rounded-md">
      <h2 class="text-xl font-semibold mb-4">Добавить объект</h2>
      <form @submit.prevent="submitData" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Широта</label>
          <input
            type="text"
            v-model="currentLatLng.lat"
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Долгота</label>
          <input
            type="text"
            v-model="currentLatLng.lng"
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Имя объекта</label
          >
          <input
            type="text"
            v-model="name"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div class="flex justify-end">
          <button
            type="submit"
            class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Добавить
          </button>
          <button
            type="button"
            @click="dialogRef.close()"
            class="ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Отмена
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<style></style>
