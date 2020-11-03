<template>
  <div id="map-container">
    <input v-model="startStop" type="text" placeholder="Start Stop">
    <input v-model="endStop" type="text" placeholder="End Stop">
    <button :disabled="running" @click="start">
      Get the route
    </button>
    <span v-if="time">{{ time }} minutes de trajet</span>
    <span v-if="noPath">Aucun chemin trouvé</span>
    <span v-if="timetaken">Calculé en {{ timetaken }} secondes</span>
    <div id="map" />
  </div>
</template>

<script>
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import { fromLonLat } from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'
import Feature from 'ol/Feature'
import OSM from 'ol/source/OSM'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle, LineString } from 'ol/geom'
import { Style, Stroke, Fill, Text } from 'ol/style'

function setStyle (color) {
  return new Style({
    stroke: new Stroke({ color, opacity: 1, width: 2 }),
    fill: new Fill({ opacity: 0.2, color })
  })
}

const visitedStyle = setStyle('green')

const goodPathStyle = setStyle('red')

const circleStyle = new Style({
  fill: new Fill({ color: 'rgba(200, 0, 0, 0.2)' }),
  stroke: new Stroke({ color: 'red', width: 3 }),
  text: new Text({
    font: '15px Calibri,sans-serif',
    fill: new Fill({ opacity: 0.2, color: 'rgba(150, 0, 0, 0.8)' }),
    stroke: new Stroke({ color: 'red' }),
    color: 'red'
  })
})

export default {
  data: () => ({
    startStop: 'MAIRIE DE LEVALLOIS', // the default start station name
    endStop: "MAIRIE D'ALFORTVILLE", // the default end station name
    running: false, // is the algorithm running ?
    listOfNodes: [], // the list of all the nodes
    map: null, // the map object
    time: 0, // the time it takes to go from point a to point b
    timetaken: 0, // the time taken by the algorithm (run time)
    noPath: false, // maybe the algorithm didn't find any path ?
    stationsLayer: null,
    linesLayer: null,
    goodPathLayer: null,
    stopUpdating: false
  }),
  mounted () {
    this.linesLayer = new VectorLayer({
      source: new VectorSource(),
      style: visitedStyle
    })

    this.goodPathLayer = new VectorLayer({
      source: new VectorSource(),
      style: goodPathStyle
    })

    this.stationsLayer = new VectorLayer({
      source: new VectorSource(),
      style (feature) {
        circleStyle.getText().setText(feature.get('name'))
        return circleStyle
      }
    })
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({ source: new OSM() }),
        this.linesLayer,
        this.goodPathLayer,
        this.stationsLayer
      ],
      view: new View({
        center: fromLonLat([2.3522, 48.8566]),
        zoom: 12,
        projection: 'EPSG:900913'
      }),
      controls: defaultControls(),
      numZoomLevels: 19,
      units: 'm'
    })
  },
  methods: {
    async start () {
      this.running = true
      const startStop = encodeURIComponent(this.startStop)
      const endStop = encodeURIComponent(this.endStop)
      const { nodes, id } = await this.$axios.$get(`/api/route?start=${startStop}&stop=${endStop}`)

      if (!nodes) { return }

      this.updateNodes(nodes)

      const inter = setInterval(async () => {
        try {
          const { nodes, done, timetaken, path } = await this.$axios.$get(`/api/route/updates/${id}`)

          if (done) {
            clearInterval(inter)
            console.log('goodPath', path)
            this.traceGoodPath(path)
            this.calculateTime(path)
            this.timetaken = timetaken
            this.running = false
          }

          await this.updateNodes(nodes)
        } catch (err) {
          console.log('error', err)
          clearInterval(inter)
          this.running = false
        }
      }, 2000)
    },

    calculateTime (path) {
      if (!path.length) {
        this.noPath = true
        return
      }
      console.log('path', path)
      this.time = ((path[path.length - 1].distance - path[0].distance) / 60)
    },

    traceGoodPath (nodes) {
      let end = null
      console.log('trace path !')
      nodes.forEach((node) => {
        const stop = node.stop
        const start = [stop.longitude, stop.latitude]
        console.log('stopname', stop.stop_name)
        this.addStation(stop)
        if (end) {
          const line = this.genLineFeature(start, end)
          this.goodPathLayer.getSource().addFeature(line)
        }
        end = [stop.longitude, stop.latitude]
      })
    },

    /**
     * returns true if the lon/lat of start and stop of two paths are identical
     */
    compareCoords ([refStart, refStop], [start, stop]) {
      return (refStart[0] === start[0] && refStart[1] === start[1] && refStop[0] === stop[0] && refStop[1] === stop[1]) ||
        (refStart[0] === stop[0] && refStart[1] === stop[1] && refStop[0] === start[0] && refStop[1] === start[1])
    },

    /**
     * Can be useful to break from a big algorithm
     */
    timeout (ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    /**
     * updates the graph
     */
    updateNodes (nodes) {
      const lines = []
      // TODO: draw new lines
      if (lines.length) {
        this.linesLayer.getSource().addFeatures(lines)
      }
    },

    genLineFeature (start, end) {
      return new Feature({
        geometry: new LineString([
          fromLonLat(start),
          fromLonLat(end)
        ])
      })
    },

    genCircleFeature (lat, lng, name) {
      return new Feature({
        geometry: new Circle(fromLonLat([lng, lat]), 100),
        name
      })
    },

    addStation (stop) {
      const circle = this.genCircleFeature(stop.latitude, stop.longitude, stop.stop_name)
      this.stationsLayer.getSource()
        .addFeature(circle)
    }
  }
}
</script>
<style>
html, body {
  height: 98%;
  margin: 0;
}

#__nuxt, #__layout, #__layout div, #map-container, #map {
  height: 100%;
  margin: 0;
}

.ol-attribution {
  display: none
}
</style>
