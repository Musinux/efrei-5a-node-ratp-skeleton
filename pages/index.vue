<template>
  <div id="map-container">
    <input v-model="startStop" type="text" placeholder="Start Stop">
    <input v-model="endStop" type="text" placeholder="End Stop">
    <button @click="start">
      Get the route
    </button>
    <span v-if="time">{{ time }} minutes de trajet</span>
    <span v-if="timetaken">Calculé en {{ timetaken }} secondes</span>
    <div id="map" />
  </div>
</template>

<script>
/* global OpenLayers */
export default {
  data: () => ({
    startStop: '',
    endStop: '',
    time: 0,
    timetaken: 0,
    standardStyle: {
      strokeColor: '${color}', // eslint-disable-line
      fontColor: 'red',
      strokeOpacity: 1,
      strokeWidth: 2,
      fillOpacity: 0.2,
      fillColor: '${color}' // eslint-disable-line
    },
    alreadyDefinedPaths: [],
    dotsLayer: null,
    linesLayer: null,
    finalPathLayer: null
  }),
  mounted () {
    this.map = new OpenLayers.Map('map', {
      controls: [
        new OpenLayers.Control.Navigation(),
        new OpenLayers.Control.PanZoomBar(),
        new OpenLayers.Control.Attribution()
      ],
      maxExtent: new OpenLayers.Bounds(),
      numZoomLevels: 19,
      units: 'm',
      projection: new OpenLayers.Projection('EPSG:900913'),
      displayProjection: this.epsg4326()
    })

    // Define the map layer
    // Here we use a predefined layer that will be kept up to date with URL changes
    this.map.addLayer(new OpenLayers.Layer.OSM.Mapnik())
    this.map.zoomToMaxExtent()

    this.linesLayer = new OpenLayers.Layer.Vector('', {
      styleMap: new OpenLayers.StyleMap({
        ...this.standardStyle,
        strokeColor: 'green'
      })
    })
    this.map.addLayer(this.linesLayer)

    this.finalPathLayer = new OpenLayers.Layer.Vector('', {
      styleMap: new OpenLayers.StyleMap({
        ...this.standardStyle,
        strokeColor: 'red'
      })
    })
    this.map.addLayer(this.finalPathLayer)
    this.dotsLayer = new OpenLayers.Layer.Vector('', {
      styleMap: new OpenLayers.StyleMap({
        ...this.standardStyle,
        label: '${name}' // eslint-disable-line
      })
    })
    this.map.addLayer(this.dotsLayer)

    this.setCenter()
  },
  methods: {
    async start () {
      // TODO
    },

    epsg4326 () {
      return new OpenLayers.Projection('EPSG:4326')
    },

    setCenter (lat, lng, zoom) {
      const lonlat = new OpenLayers.LonLat(lng || 2.3522, lat || 48.8566)
        .transform(this.epsg4326(), this.map.getProjectionObject())
      this.map.setCenter(lonlat, zoom || 12)
    },

    genLine (start, end, color = 'green') {
      const startLonLat = new OpenLayers.LonLat(start[0], start[1]).transform(
        this.epsg4326(),
        this.map.getProjectionObject()
      )
      const startPoint = new OpenLayers.Geometry.Point(startLonLat.lon, startLonLat.lat)
      const endLonLat = new OpenLayers.LonLat(end[0], end[1]).transform(
        this.epsg4326(),
        this.map.getProjectionObject()
      )
      const endPoint = new OpenLayers.Geometry.Point(endLonLat.lon, endLonLat.lat)
      return new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([startPoint, endPoint]))
    },

    addLine (start, end, color = 'green') {
      const line = this.genLine(start, end, color)
      if (color === 'green') {
        this.linesLayer.addFeatures([line])
      } else {
        this.finalPathLayer.addFeatures([line])
      }
    },

    genCircle (lat, lng, radius, color, name) {
      const lonLat = new OpenLayers.LonLat(lng, lat).transform(
        this.epsg4326(),
        this.map.getProjectionObject()
      )

      const point = new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat)

      const circle = OpenLayers.Geometry.Polygon.createRegularPolygon(point, radius, 40, 0)

      return new OpenLayers.Feature.Vector(circle, { name, color })
    },

    addCircle (lat, lng, radius, color, name) {
      this.dotsLayer.addFeatures([this.genCircle(lat, lng, radius, color, name)])
    },

    removeLayers () {
      while (this.allLayers.length > 0) {
        this.map.removeLayer(this.allLayers.pop())
      }
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
</style>
